#!/usr/bin/env node
// Regenerates the Cursor and Copilot mirror entries from their `.claude/`
// sources. The pre-commit hook runs this whenever a mirrored source is staged,
// so nobody has to remember it; `validate-agent-docs` is the backstop that fails
// when a copy has drifted anyway (a `--no-verify` commit, a bad merge).
//
// Modes:
//   --check          report what would change and exit 1, without writing
//   --print-changed  write, and print ONLY the changed paths on stdout, so a
//                    caller can stage exactly those (summary goes to stderr)
//
// Any non-flag argument is a source path to limit the run to, which is how the
// pre-commit hook keeps a commit from picking up mirrors of a source the author
// left unstaged. Content always comes from the working tree, so a partially
// staged source can still commit a mirror of bytes that were not staged — CI's
// full validation is the backstop for that.
//
// Usage: node scripts/sync-agent-mirrors.mjs [--check | --print-changed] [source...]

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { AGENT_MIRRORS, SYNC_COMMAND } from './agent-mirrors.mjs';
import { renderMirror } from './render-agent-mirror.mjs';

const args = process.argv.slice(2);
const isCheckOnly = args.includes('--check');
const isPrintChanged = args.includes('--print-changed');
// Keeps stdout parseable when the caller pipes the changed paths into `git add`.
const report = isPrintChanged ? console.error : console.log;

const onlySources = new Set(args.filter((arg) => !arg.startsWith('--')));
const entries = onlySources.size ? AGENT_MIRRORS.filter(({ source }) => onlySources.has(source)) : AGENT_MIRRORS;

const missingSources = [];
const stale = [];
let written = 0;

for (const { source, mirrors } of entries) {
  if (!existsSync(source)) {
    missingSources.push(source);
    continue;
  }

  const src = readFileSync(source, 'utf8');

  for (const { path: mirror, mode } of mirrors) {
    const expected = renderMirror(src, { source, mode });
    const isCurrent = existsSync(mirror) && readFileSync(mirror, 'utf8') === expected;
    if (isCurrent) continue;

    stale.push({ mirror, source, mode });
    if (isCheckOnly) continue;

    mkdirSync(dirname(mirror), { recursive: true });
    writeFileSync(mirror, expected);
    written += 1;
  }
}

if (missingSources.length) {
  console.error(
    'Mirror sources missing — update scripts/agent-mirrors.mjs if a file moved:\n' +
      missingSources.map((source) => `  ${source}`).join('\n'),
  );
  process.exit(1);
}

const total = entries.reduce((sum, { mirrors }) => sum + mirrors.length, 0);

const listing = stale.map(({ mirror, source, mode }) => `  ${mirror} <- ${source} (${mode})`).join('\n');

if (isCheckOnly) {
  if (stale.length) {
    console.error(`${stale.length} of ${total} mirror entries are out of sync (run \`${SYNC_COMMAND}\`):\n${listing}`);
    process.exit(1);
  }
  report(`All ${total} mirror entries match their sources.`);
} else {
  report(
    written === 0
      ? `All ${total} mirror entries already matched their sources.`
      : `Updated ${written} of ${total} mirror entries:\n${listing}`,
  );
  if (isPrintChanged) {
    for (const { mirror } of stale) console.log(mirror);
  }
}
