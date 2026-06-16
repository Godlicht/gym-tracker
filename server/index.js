import { createServer } from "node:http";
import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { createEmptyAppData, seedAppData } from "../src/data/seedData.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const dbPath = process.env.DATABASE_PATH ?? path.join(dataDir, "forgefit.sqlite");
const port = Number(process.env.API_PORT ?? process.env.PORT ?? 4000);
const sessionCookieName = "forgefit_session";
const sessionTtlMs = 7 * 24 * 60 * 60 * 1000;
const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGIN ?? "http://127.0.0.1:3006,http://localhost:3006")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_data (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

seedDemoAccount();

const server = createServer(async (req, res) => {
  try {
    applyCors(req, res);

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (!req.url?.startsWith("/api/")) {
      sendJson(res, 404, { message: "Nie znaleziono endpointu." });
      return;
    }

    if (isMutatingMethod(req.method) && !isTrustedOrigin(req)) {
      sendJson(res, 403, { message: "Nieprawidłowe źródło żądania." });
      return;
    }

    await route(req, res);
  } catch (error) {
    if (error.status === 413) {
      sendJson(res, 413, { message: "Żądanie jest zbyt duże." });
      return;
    }

    if (error instanceof SyntaxError) {
      sendJson(res, 400, { message: "Nieprawidłowy JSON." });
      return;
    }

    console.error(error);
    sendJson(res, 500, { message: "Wystąpił błąd serwera." });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`ForgeFit API listening on http://127.0.0.1:${port}`);
  console.log(`SQLite database: ${dbPath}`);
});

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === "POST" && pathname === "/api/auth/register") {
    const body = await readJson(req);
    const validation = validateRegistration(body);
    if (!validation.ok) {
      sendJson(res, 400, { message: validation.message });
      return;
    }

    const existingUser = getUserByEmail(validation.email);
    if (existingUser) {
      sendJson(res, 409, { message: "Konto z tym adresem e-mail już istnieje." });
      return;
    }

    const user = createUser(validation.name, validation.email, validation.password);
    const data = createEmptyAppData(user);
    saveUserData(user.id, data);
    issueSession(res, user.id);
    sendJson(res, 201, { user: publicUser(user), data });
    return;
  }

  if (req.method === "POST" && pathname === "/api/auth/login") {
    const body = await readJson(req);
    const email = normalizeEmail(body?.email);
    const password = String(body?.password ?? "");
    const user = getUserByEmail(email);

    if (!user || !verifyPassword(password, user.password_salt, user.password_hash)) {
      sendJson(res, 401, { message: "Nieprawidłowy e-mail lub hasło." });
      return;
    }

    issueSession(res, user.id);
    sendJson(res, 200, { user: publicUser(user), data: getUserData(user) });
    return;
  }

  if (req.method === "POST" && pathname === "/api/auth/logout") {
    const token = getSessionToken(req);
    if (token) {
      db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
    }
    clearSessionCookie(res);
    sendJson(res, 200, { ok: true });
    return;
  }

  const auth = requireAuth(req);
  if (!auth.ok) {
    clearSessionCookie(res);
    sendJson(res, 401, { message: "Sesja wygasła. Zaloguj się ponownie." });
    return;
  }

  if (req.method === "GET" && pathname === "/api/me") {
    sendJson(res, 200, { user: publicUser(auth.user), data: getUserData(auth.user) });
    return;
  }

  if (req.method === "PUT" && pathname === "/api/data") {
    const body = await readJson(req, 2_000_000);
    const data = body?.data;
    const validation = validateAppData(data);
    if (!validation.ok) {
      sendJson(res, 400, { message: validation.message });
      return;
    }

    saveUserData(auth.user.id, data);
    sendJson(res, 200, { data });
    return;
  }

  if (req.method === "PATCH" && pathname === "/api/profile") {
    const body = await readJson(req);
    const profile = body?.profile;
    const validation = validateProfile(profile);
    if (!validation.ok) {
      sendJson(res, 400, { message: validation.message });
      return;
    }

    const existingUser = getUserByEmail(validation.email);
    if (existingUser && existingUser.id !== auth.user.id) {
      sendJson(res, 409, { message: "Ten e-mail jest już zajęty." });
      return;
    }

    const data = getUserData(auth.user);
    const nextProfile = {
      ...data.profile,
      ...profile,
      name: validation.name,
      email: validation.email,
      goal: String(profile.goal ?? "").trim(),
    };
    const nextData = {
      ...data,
      profile: nextProfile,
    };

    db.exec("BEGIN");
    try {
      db.prepare("UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(validation.name, validation.email, auth.user.id);
      saveUserData(auth.user.id, nextData);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    const user = getUserById(auth.user.id);
    sendJson(res, 200, { user: publicUser(user), data: nextData });
    return;
  }

  sendJson(res, 404, { message: "Nie znaleziono endpointu." });
}

function seedDemoAccount() {
  const existingDemo = getUserByEmail("demo@forgefit.app");
  if (existingDemo) return;

  const user = createUser("Jakub", "demo@forgefit.app", "demo123");
  saveUserData(user.id, seedAppData);
}

function createUser(name, email, password) {
  const id = createId("user");
  const { salt, hash } = hashPassword(password);
  db.prepare("INSERT INTO users (id, name, email, password_hash, password_salt) VALUES (?, ?, ?, ?, ?)").run(id, name, email, hash, salt);
  return getUserById(id);
}

function issueSession(res, userId) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = Date.now() + sessionTtlMs;
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
  db.prepare("INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)").run(createId("session"), userId, tokenHash, expiresAt);
  setSessionCookie(res, token, expiresAt);
}

function requireAuth(req) {
  const token = getSessionToken(req);
  if (!token) return { ok: false };

  const session = db
    .prepare(
      `SELECT sessions.*, users.id AS user_id, users.name, users.email, users.password_hash, users.password_salt
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.token_hash = ?`,
    )
    .get(hashToken(token));

  if (!session || Number(session.expires_at) < Date.now()) {
    if (session) db.prepare("DELETE FROM sessions WHERE id = ?").run(session.id);
    return { ok: false };
  }

  return {
    ok: true,
    user: {
      id: session.user_id,
      name: session.name,
      email: session.email,
      password_hash: session.password_hash,
      password_salt: session.password_salt,
    },
  };
}

function getUserData(user) {
  const row = db.prepare("SELECT data_json FROM user_data WHERE user_id = ?").get(user.id);
  if (!row) {
    const data = createEmptyAppData(user);
    saveUserData(user.id, data);
    return data;
  }

  return JSON.parse(row.data_json);
}

function saveUserData(userId, data) {
  db.prepare(
    `INSERT INTO user_data (user_id, data_json, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO UPDATE SET data_json = excluded.data_json, updated_at = CURRENT_TIMESTAMP`,
  ).run(userId, JSON.stringify(data));
}

function getUserByEmail(email) {
  if (!email) return null;
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) ?? null;
}

function getUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) ?? null;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function validateRegistration(body) {
  const name = String(body?.name ?? "").trim();
  const email = normalizeEmail(body?.email);
  const password = String(body?.password ?? "");

  if (name.length < 2) return { ok: false, message: "Podaj nazwę profilu." };
  if (!isValidEmail(email)) return { ok: false, message: "Podaj poprawny adres e-mail." };
  if (password.length < 6) return { ok: false, message: "Hasło musi mieć co najmniej 6 znaków." };

  return { ok: true, name, email, password };
}

function validateProfile(profile) {
  const name = String(profile?.name ?? "").trim();
  const email = normalizeEmail(profile?.email);
  const goal = String(profile?.goal ?? "").trim();

  if (name.length < 2) return { ok: false, message: "Podaj nazwę profilu." };
  if (!isValidEmail(email)) return { ok: false, message: "Podaj poprawny adres e-mail." };
  if (goal.length < 3) return { ok: false, message: "Podaj cel treningowy." };

  return { ok: true, name, email };
}

function validateAppData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, message: "Nieprawidłowy format danych." };
  }

  if (!data.profile || typeof data.profile !== "object") {
    return { ok: false, message: "Brakuje profilu użytkownika." };
  }

  if (!data.weeklyPlan || typeof data.weeklyPlan !== "object") {
    return { ok: false, message: "Brakuje planu treningowego." };
  }

  if (!Array.isArray(data.workouts) || !Array.isArray(data.bodyMetrics)) {
    return { ok: false, message: "Historia i pomiary muszą być listami." };
  }

  return { ok: true };
}

function hashPassword(password, salt = randomBytes(16).toString("base64url")) {
  const hash = pbkdf2Sync(password, salt, 210_000, 32, "sha256").toString("base64url");
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  const actual = Buffer.from(hash);
  const expected = Buffer.from(expectedHash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("base64url");
}

function createId(prefix) {
  return `${prefix}-${randomBytes(16).toString("hex")}`;
}

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function readJson(req, limitBytes = 256_000) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) {
      const error = new Error("Payload too large");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function getSessionToken(req) {
  const cookies = parseCookies(req.headers.cookie ?? "");
  return cookies[sessionCookieName] ?? "";
}

function parseCookies(cookieHeader) {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [key, ...value] = part.split("=");
        return [key, decodeURIComponent(value.join("="))];
      }),
  );
}

function setSessionCookie(res, token, expiresAt) {
  const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${sessionCookieName}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${sessionCookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

function isMutatingMethod(method) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method);
}

function isTrustedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  return allowedOrigins.has(origin);
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
