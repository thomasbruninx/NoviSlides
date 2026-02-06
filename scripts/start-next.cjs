const { spawn } = require('node:child_process');

const nextBin = require.resolve('next/dist/bin/next');
const args = [nextBin, 'start', ...process.argv.slice(2)];

const child = spawn(process.execPath, args, {
  stdio: 'inherit',
  env: process.env
});

let shuttingDown = false;
let forceKillTimer = null;

const clearForceKillTimer = () => {
  if (forceKillTimer) {
    clearTimeout(forceKillTimer);
    forceKillTimer = null;
  }
};

const forceKillChild = () => {
  child.kill('SIGKILL');
};

const shutdown = (signal) => {
  if (shuttingDown) {
    forceKillChild();
    return;
  }

  shuttingDown = true;
  child.kill(signal);
  forceKillTimer = setTimeout(forceKillChild, 1500);
  if (typeof forceKillTimer.unref === 'function') {
    forceKillTimer.unref();
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

child.on('error', (error) => {
  clearForceKillTimer();
  console.error(error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  clearForceKillTimer();
  if (signal === 'SIGINT') {
    process.exit(130);
    return;
  }
  if (signal === 'SIGTERM') {
    process.exit(143);
    return;
  }
  process.exit(code ?? 0);
});
