const apiBase = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:4000/api";

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${apiBase}${path}`, {
      method: options.method ?? "GET",
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      credentials: "include",
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    return {
      ok: false,
      message: "Nie można połączyć się z backendem.",
    };
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      message: payload.message ?? "Wystąpił błąd połączenia z API.",
    };
  }

  return {
    ok: true,
    ...payload,
  };
}

export const api = {
  me() {
    return request("/me");
  },
  login(credentials) {
    return request("/auth/login", {
      method: "POST",
      body: credentials,
    });
  },
  register(payload) {
    return request("/auth/register", {
      method: "POST",
      body: payload,
    });
  },
  logout() {
    return request("/auth/logout", {
      method: "POST",
      body: {},
    });
  },
  saveData(data) {
    return request("/data", {
      method: "PUT",
      body: { data },
    });
  },
  updateProfile(profile) {
    return request("/profile", {
      method: "PATCH",
      body: { profile },
    });
  },
};
