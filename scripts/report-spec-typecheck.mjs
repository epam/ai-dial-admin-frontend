#!/usr/bin/env node
// Turns a `tsc -p tsconfig.spec.json` log into something readable in a CI run:
// one annotation per diagnostic (so an error shows up on the line it is about),
// a per-file group in the step log, and a table in the job summary. Without it
// the step log holds nothing but the shell it ran, because the gate redirects
// tsc's output to a file to count it.
//
// Usage: node scripts/report-spec-typecheck.mjs <log> <tsc-exit-status>
//
// It never decides the outcome — the caller exits with tsc's own status, so a
// crash with no parseable diagnostic still fails the job (and gets its log
// tail printed here).

import { appendFileSync, readFileSync } from 'node:fs';

// `nx run ai-dial-admin:typecheck-specs` runs tsc from the project directory, so
// every path in the log is relative to it. Annotations need one from the repo root.
const PROJECT_DIR = 'apps/ai-dial-admin';
// GitHub renders at most 10 error annotations per step; the rest live in the groups below.
const ANNOTATION_LIMIT = 10;
const SUMMARY_FILE_LIMIT = 30;
const LOG_TAIL_LINES = 40;

const DIAGNOSTIC =
  /^(?<file>\S.*\.tsx?)\((?<line>\d+),(?<column>\d+)\): (?<severity>error|warning) (?<rest>TS\d+: .*)$/;
// nx and npm indent their own banners, which would otherwise read as a continuation of the last
// diagnostic and get reported under whichever file happened to fail last.
const RUNNER_NOISE = /^\s*(NX\s|>|npm |Warning:|Failed tasks:|View structured|Hint:)/;

const [logPath, statusArg] = process.argv.slice(2);

if (!logPath) {
  console.error('report-spec-typecheck: pass the tsc log path.');
  process.exit(2);
}

const log = readFileSync(logPath, 'utf8');
const status = Number.parseInt(statusArg ?? '0', 10);

/**
 * tsc writes one line per diagnostic, then indents the explanation of a type mismatch
 * underneath it, so an indented line belongs to the diagnostic above it.
 */
const parseDiagnostics = (content) => {
  const diagnostics = [];

  for (const line of content.split('\n')) {
    if (RUNNER_NOISE.test(line)) {
      continue;
    }

    const match = DIAGNOSTIC.exec(line);

    if (match) {
      const { file, line: lineNumber, column, severity, rest } = match.groups;
      diagnostics.push({ file, line: Number(lineNumber), column: Number(column), severity, rest, detail: [] });
      continue;
    }

    if (/^\s+\S/.test(line) && diagnostics.length > 0) {
      diagnostics.at(-1).detail.push(line);
    }
  }

  return diagnostics;
};

const groupByFile = (diagnostics) => {
  const byFile = new Map();

  for (const diagnostic of diagnostics) {
    const group = byFile.get(diagnostic.file) ?? [];
    group.push(diagnostic);
    byFile.set(diagnostic.file, group);
  }

  // Worst file first: whoever reads a red step wants the concentration, not the alphabet.
  return [...byFile.entries()].sort(([fileA, a], [fileB, b]) => b.length - a.length || fileA.localeCompare(fileB));
};

const writeSummary = (markdown) => {
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
  }
};

const diagnostics = parseDiagnostics(log);

if (diagnostics.length === 0) {
  if (status === 0) {
    console.log('Spec-file typecheck passed: 0 errors.');
    writeSummary('## Spec-file type errors: 0');
    process.exit(0);
  }

  // Nothing parseable but a non-zero status: an nx failure, an out-of-memory tsc, a bad tsconfig.
  const tail = log.split('\n').slice(-LOG_TAIL_LINES).join('\n');
  console.log(`::error::typecheck:specs failed with no parseable diagnostic (exit ${status}).`);
  console.log(tail);
  writeSummary(`## Spec-file typecheck failed\n\nExit ${status}, no parseable diagnostic:\n\n\`\`\`\n${tail}\n\`\`\``);
  process.exit(0);
}

const byFile = groupByFile(diagnostics);

console.log(`::error::${diagnostics.length} type error(s) in ${byFile.length} spec file(s) — see the groups below.`);

for (const [index, diagnostic] of diagnostics.slice(0, ANNOTATION_LIMIT).entries()) {
  const location = `file=${PROJECT_DIR}/${diagnostic.file},line=${diagnostic.line},col=${diagnostic.column}`;
  console.log(`::${diagnostic.severity} ${location},title=Spec type error ${index + 1}::${diagnostic.rest}`);
}

for (const [file, fileDiagnostics] of byFile) {
  console.log(`::group::${file} — ${fileDiagnostics.length} error(s)`);

  for (const diagnostic of fileDiagnostics) {
    console.log(`  ${diagnostic.line}:${diagnostic.column}  ${diagnostic.rest}`);

    // tsc indents two spaces per level of a type mismatch, and that nesting is the explanation.
    for (const detail of diagnostic.detail) {
      console.log(`  ${detail.replace(/\s+$/, '')}`);
    }
  }

  console.log('::endgroup::');
}

const table = [
  `## Spec-file type errors: ${diagnostics.length}`,
  '',
  '`npm run typecheck:specs` from the repository root reproduces this.',
  '',
  '| Errors | File |',
  '| -----: | ---- |',
  ...byFile
    .slice(0, SUMMARY_FILE_LIMIT)
    .map(([file, fileDiagnostics]) => `| ${fileDiagnostics.length} | \`${file}\` |`),
];

if (byFile.length > SUMMARY_FILE_LIMIT) {
  table.push('', `…and ${byFile.length - SUMMARY_FILE_LIMIT} more file(s).`);
}

const details = byFile.slice(0, SUMMARY_FILE_LIMIT).map(([file, fileDiagnostics]) => {
  const lines = fileDiagnostics.flatMap((diagnostic) => [
    `${diagnostic.line}:${diagnostic.column}  ${diagnostic.rest}`,
    ...diagnostic.detail.map((detail) => `  ${detail.replace(/\s+$/, '')}`),
  ]);

  return `<details><summary><code>${file}</code> — ${fileDiagnostics.length}</summary>\n\n\`\`\`\n${lines.join('\n')}\n\`\`\`\n\n</details>`;
});

writeSummary([...table, '', ...details].join('\n'));
