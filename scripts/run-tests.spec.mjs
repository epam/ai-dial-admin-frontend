// Tests the `npm run test` wrapper: that it reports and forwards the child's exit code AND signal,
// sets the heap limit without clobbering an existing one, and parses `ps` output into a tree RSS.
//
// Run: npm run test:scripts

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildNxArgs, describeExit, run, sumTreeRss, toExitStatus, withHeapLimit } from './run-tests.mjs';

const runNode = (source, options = {}) => {
  const lines = [];
  return run({
    command: process.execPath,
    args: ['-e', source],
    env: process.env,
    log: (line) => lines.push(line),
    ...options,
  }).then((result) => ({ ...result, lines }));
};

test('forwards a non-zero exit code and reports it', async () => {
  const { code, signal, lines } = await runNode('process.exit(3)');

  assert.equal(code, 3);
  assert.equal(signal, null);
  assert.equal(toExitStatus({ code, signal }), 3);
  assert.match(lines.at(-1), /exit code=3 signal=none/);
});

test('forwards a zero exit code', async () => {
  const { code, signal } = await runNode('process.exit(0)');

  assert.equal(toExitStatus({ code, signal }), 0);
});

test('reports the signal when the child is killed, which is how an OOM kill looks', async (context) => {
  if (process.platform === 'win32') {
    context.skip('POSIX signals are not delivered on Windows');
    return;
  }
  const { code, signal, lines } = await runNode("process.kill(process.pid, 'SIGKILL')");

  assert.equal(code, null);
  assert.equal(signal, 'SIGKILL');
  assert.equal(toExitStatus({ code, signal }), 137);
  assert.match(lines.at(-1), /exit code=none signal=SIGKILL/);
});

test('logs memory at start and end', async () => {
  const { lines } = await runNode('process.exit(0)');

  assert.match(lines[0], /start cpus=\d+ mem total=\d+MB free=\d+MB/);
  assert.match(lines.at(-1), /mem total=\d+MB free=\d+MB/);
});

test('reports a failure to start the child as a failed run', async () => {
  const lines = [];
  const result = await run({
    command: 'definitely-not-a-real-binary',
    args: [],
    env: process.env,
    log: (line) => lines.push(line),
  });

  assert.equal(toExitStatus(result), 1);
  assert.match(lines.at(-1), /failed to start/);
});

test('describeExit names a missing code or signal explicitly', () => {
  assert.equal(describeExit({ code: 1, signal: null }), 'exit code=1 signal=none');
  assert.equal(describeExit({ code: null, signal: 'SIGTERM' }), 'exit code=none signal=SIGTERM');
});

test('toExitStatus falls back to 1 for an unknown signal', () => {
  assert.equal(toExitStatus({ code: null, signal: 'SIGNOPE' }), 129);
  assert.equal(toExitStatus({ code: null, signal: null }), 1);
});

test('withHeapLimit adds the flag, and keeps an existing one', () => {
  assert.equal(withHeapLimit(undefined), '--max-old-space-size=4096');
  assert.equal(withHeapLimit('--trace-warnings'), '--trace-warnings --max-old-space-size=4096');
  assert.equal(withHeapLimit('--max-old-space-size=8192'), '--max-old-space-size=8192');
});

test('sumTreeRss adds up the root and every descendant but nothing else', () => {
  const ps = [
    '  100     1  2048', // unrelated
    '  200   100  1024', // root
    '  201   200  3072', // child
    '  202   201  1024', // grandchild
    '  300     1  9999', // unrelated
    'garbage line',
  ].join('\n');

  assert.deepEqual(sumTreeRss(ps, 200), { processes: 3, rssMb: 5 });
});

test('sumTreeRss counts only the root when it has no children', () => {
  assert.deepEqual(sumTreeRss('  200     1  2048\n', 200), { processes: 1, rssMb: 2 });
});

test('buildNxArgs asks Nx to show the output of a succeeded task under GitHub Actions', () => {
  assert.deepEqual(buildNxArgs([], { GITHUB_ACTIONS: 'true' }), [
    'run-many',
    '-t',
    'test',
    '--runInBand',
    '--coverage',
    '--output-style=static',
  ]);
});

test('buildNxArgs leaves local runs alone', () => {
  assert.deepEqual(buildNxArgs([], {}), ['run-many', '-t', 'test', '--runInBand', '--coverage']);
});

test('buildNxArgs keeps extra arguments after the defaults', () => {
  assert.deepEqual(buildNxArgs(['--testFiles=a.spec.ts'], {}).slice(-1), ['--testFiles=a.spec.ts']);
});

for (const own of ['--output-style=stream', '--outputStyle=stream', '--verbose']) {
  test(`buildNxArgs does not add an output style when the caller passed ${own}`, () => {
    const args = buildNxArgs([own], { GITHUB_ACTIONS: 'true' });

    assert.ok(!args.includes('--output-style=static'));
    assert.ok(args.includes(own));
  });
}
