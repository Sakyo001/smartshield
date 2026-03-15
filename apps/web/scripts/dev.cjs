#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
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
const args = ["dev", ...extraArgs];

if (!hasPortArg) {
  args.push("--port", "3001");
}

const env = { ...process.env };
delete env.INIT_CWD;
delete env.PWD;
delete env.npm_config_local_prefix;
delete env.npm_config_prefix;
env.PWD = normalizedCwd;

console.log(`[web dev] using cwd: ${normalizedCwd}`);

const child = spawn(process.execPath, [nextBin, ...args], {
  cwd: normalizedCwd,
  stdio: "inherit",
  env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
