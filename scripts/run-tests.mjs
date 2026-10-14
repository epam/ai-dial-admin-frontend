#!/usr/bin/env node
// Entry point for `npm run test`. It runs the same `nx run-many -t test --runInBand --coverage` the
// script used to inline, and adds what that command cannot give us:
//
//   - `NODE_OPTIONS` set from node rather than a shell prefix, so the script runs under cmd.exe too
//   - the child's exit code AND signal in the log. A test run that ends with no reporter output at
//     all (the CI failures this wrapper was added for) is almost always a killed process, and
//     `signal=SIGKILL` is how an out-of-memory kill shows up
//   - memory figures at start and end, and, under GitHub Actions, the child tree's RSS every 30 s, so
//     a memory ramp is visible in the log of a run that then dies silently
//
// stdio is forwarded untouched and the child's exit status is propagated, so nothing downstream
// (husky, CI) sees a different result than before.
//
// Usage: node scripts/run-tests.mjs [extra nx/vitest args...]

import { spawn, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { constants, cpus, freemem, totalmem } from 'node:os';
import { pathToFileURL } from 'node:url';

const HEAP_FLAG = '--max-old-space-size=4096';
const SAMPLE_INTERVAL_MS = 30_000;
const BYTES_PER_MB = 1024 * 1024;
const KB_PER_MB = 1024;

const toMb = (bytes) => Math.round(bytes / BYTES_PER_MB);

export const withHeapLimit = (nodeOptions = '') =>
  nodeOptions.includes('--max-old-space-size') ? nodeOptions : `${nodeOptions} ${HEAP_FLAG}`.trim();

export const describeExit = ({ code, signal }) => `exit code=${code ?? 'none'} signal=${signal ?? 'none'}`;

// A signal has no exit code of its own; 128 + signal number is the shell convention.
export const toExitStatus = ({ code, signal }) => {
  if (code != null) {
    return code;
  }
  return signal ? 128 + (constants.signals[signal] ?? 1) : 1;
};

// `ps -eo pid=,ppid=,rss=` lines → total RSS in MB of `rootPid` and all its descendants.
export const sumTreeRss = (psOutput, rootPid) => {
  const rows = psOutput
    .split('\n')
    .map((line) => line.trim().split(/\s+/).map(Number))
    .filter((cols) => cols.length === 3 && cols.every(Number.isFinite))
    .map(([pid, ppid, rssKb]) => ({ pid, ppid, rssKb }));

  const inTree = new Set([rootPid]);
  let isGrowing = true;
  while (isGrowing) {
    isGrowing = false;
    for (const { pid, ppid } of rows) {
      if (inTree.has(ppid) && !inTree.has(pid)) {
        inTree.add(pid);
        isGrowing = true;
      }
    }
  }

  const tree = rows.filter(({ pid }) => inTree.has(pid));
  return { processes: tree.length, rssMb: Math.round(tree.reduce((sum, { rssKb }) => sum + rssKb, 0) / KB_PER_MB) };
};

const memorySummary = () => `mem total=${toMb(totalmem())}MB free=${toMb(freemem())}MB`;

const sampleTree = (rootPid, log) => {
  // `ps` has no Windows equivalent worth the complexity; local Windows runs skip the sampling.
  if (process.platform === 'win32') {
    return;
  }
  const { stdout, status } = spawnSync('ps', ['-eo', 'pid=,ppid=,rss='], { encoding: 'utf8' });
  if (status !== 0) {
    return;
  }
  const { processes, rssMb } = sumTreeRss(stdout, rootPid);
  log(`tree rss=${rssMb}MB processes=${processes} ${memorySummary()}`);
};

export const run = ({ command, args, env, log = console.log, sampleIntervalMs = 0 }) =>
  new Promise((resolve) => {
    const startedAt = Date.now();
    const stamp = (message) => log(`[run-tests +${Math.round((Date.now() - startedAt) / 1000)}s] ${message}`);

    stamp(`start cpus=${cpus().length} ${memorySummary()}`);
    const child = spawn(command, args, { stdio: 'inherit', env });
    const timer = sampleIntervalMs ? setInterval(() => sampleTree(child.pid, stamp), sampleIntervalMs) : undefined;

    child.on('error', (error) => {
      clearInterval(timer);
      stamp(`failed to start: ${error.message}`);
      resolve({ code: 1, signal: null });
    });
    child.on('exit', (code, signal) => {
      clearInterval(timer);
      stamp(`${describeExit({ code, signal })} ${memorySummary()}`);
      resolve({ code, signal });
    });
  });

// Resolved through the package's own `bin` entry: `nx/bin/nx.js` is not a stable import path.
const resolveNxBin = () => {
  const require = createRequire(import.meta.url);
  const manifestPath = require.resolve('nx/package.json');
  return join(dirname(manifestPath), require(manifestPath).bin.nx);
};

const main = async () => {
  const nxBin = resolveNxBin();
  const result = await run({
    command: process.execPath,
    args: [nxBin, 'run-many', '-t', 'test', '--runInBand', '--coverage', ...process.argv.slice(2)],
    env: { ...process.env, NODE_OPTIONS: withHeapLimit(process.env.NODE_OPTIONS) },
    sampleIntervalMs: process.env.GITHUB_ACTIONS ? SAMPLE_INTERVAL_MS : 0,
  });
  process.exit(toExitStatus(result));
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
