import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const viteBin = path.join(root, "node_modules", "vite", "bin", "vite.js");
const viteArgs = process.argv.slice(2);

const children = [
  spawn(process.execPath, [path.join(root, "server", "index.js")], {
    cwd: root,
    env: {
      ...process.env,
      API_PORT: process.env.API_PORT ?? "4000",
    },
    stdio: "inherit",
  }),
  spawn(process.execPath, [viteBin, ...viteArgs], {
    cwd: root,
    stdio: "inherit",
  }),
];

let shuttingDown = false;

for (const child of children) {
  child.on("exit", (code) => {
    if (shuttingDown) return;
    shuttingDown = true;
    for (const other of children) {
      if (other !== child && !other.killed) other.kill();
    }
    process.exit(code ?? 0);
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    shuttingDown = true;
    for (const child of children) {
      if (!child.killed) child.kill(signal);
    }
  });
}
