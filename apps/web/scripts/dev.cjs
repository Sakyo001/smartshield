#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const { spawn } = require("node:child_process");

function getCanonicalCwd() {
  const cwd = process.cwd();
  const desktopFixed = cwd.replace(/\\desktop\\/i, "\\Desktop\\");

  if (desktopFixed !== cwd && fs.existsSync(desktopFixed)) {
    return desktopFixed;
  }

  return fs.realpathSync(cwd);
}

const normalizedCwd = getCanonicalCwd();
const nextBin = require.resolve("next/dist/bin/next");
const extraArgs = process.argv.slice(2);
const hasPortArg = extraArgs.some((arg) => arg === "--port" || arg.startsWith("--port="));

const env = { ...process.env };
delete env.INIT_CWD;
delete env.PWD;
delete env.npm_config_local_prefix;
delete env.npm_config_prefix;
env.PWD = normalizedCwd;

function getPreferredPort() {
  const fromEnv = Number.parseInt(env.PORT || "", 10);
  return Number.isInteger(fromEnv) && fromEnv > 0 ? fromEnv : 3001;
}

function canListenOnPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, "::");
  });
}

async function findAvailablePort(startPort, attempts = 20) {
  for (let offset = 0; offset < attempts; offset += 1) {
    const candidate = startPort + offset;
    if (await canListenOnPort(candidate)) {
      return candidate;
    }
  }

  return startPort;
}

async function run() {
  const args = ["dev", ...extraArgs];
  const preferredPort = getPreferredPort();

  if (!hasPortArg) {
    const selectedPort = await findAvailablePort(preferredPort);
    args.push("--port", String(selectedPort));

    if (selectedPort !== preferredPort) {
      console.log(
        `[web dev] port ${preferredPort} is in use, switching to ${selectedPort}`,
      );
    }
  }

  console.log(`[web dev] using cwd: ${normalizedCwd}`);

  const child = spawn(process.execPath, [nextBin, ...args], {
    cwd: normalizedCwd,
    stdio: "inherit",
    env,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

run().catch((error) => {
  console.error("[web dev] failed to start:", error);
  process.exit(1);
});
