// Tests the agent-config validator against fixtures that are intentionally
// broken in exactly one way each, proving the gate actually rejects them (and
// accepts a clean file). Fixtures are written to a throwaway temp dir under
// scripts/ at runtime (not committed); that dir is matched by .prettierignore
// so the validator only exercises the specific structural check under test —
// prettier formatting never fires on a deliberately-malformed fixture.
//
// Two kinds of test live here:
//   - per-file checks, run by passing the fixture path as an argument (the same
//     way the Claude PostToolUse hook runs)
//   - full-scan checks (mirror integrity), run with NO arguments and `cwd` set
//     to a fixture directory shaped like a miniature repo, because those checks
//     read the mirror manifest and compare whole trees rather than one file
//
// Run: npm run validate:agent-docs:test

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(here);
const script = join(here, 'validate-agent-docs.mjs');

// Each fixture is one intentionally-broken (or clean) config file, keyed by the
// relative path the validator keys its checks off (`.claude/skills/.../SKILL.md`,
// `.mcp.json`, etc.). U+200B is the zero-width space the hidden-char check flags.
const FIXTURES = {
  'broken/.claude/skills/bad-yaml/SKILL.md':
    '---\nname: bad-yaml\ndescription: "open quote\nbroken: [unclosed\n---\n\nBody.\n',
  'broken/.claude/skills/unterminated/SKILL.md': '---\nname: unterminated\ndescription: no closing fence\n',
  'broken/.claude/skills/missing-name/SKILL.md': '---\ndescription: has a description but no name\n---\n\nBody.\n',
  'broken/.claude/rules/hidden-char.md': '# Rule\n\nThis line has a hidden​character.\n',
  'broken/.claude/rules/bad-globs.md': "---\nglobs:\n  - '**/*.ts'\n---\n\nBody.\n",
  'broken/.claude/rules/missing-ref.md': '# Rule\n\n@.claude/rules/does-not-exist.md\n',
  'broken/.claude/settings.json': '{ "permissions": { "allow": [ }\n',
  'broken/.mcp.json':
    '{\n  "mcpServers": {\n    "demo": {\n      "command": "npx",\n      "args": [\n        "-y",\n        "some-package@latest"\n      ]\n    }\n  }\n}\n',
  'broken/.claude/skills/dup-a/SKILL.md':
    '---\nname: duplicate-name\ndescription: first skill with this name\n---\n\nBody.\n',
  'broken/.claude/skills/dup-b/SKILL.md':
    '---\nname: duplicate-name\ndescription: second skill with this name\n---\n\nBody.\n',
  // AWS keys and private-key headers never appear as examples, so they are
  // unambiguous. `AKIA` + 16 uppercase/digits is the access-key-id shape.
  'broken/.claude/rules/aws-key.md': '# Rule\n\nUse the key `AKIA1234567890ABCDEF` for the upload.\n',
  'broken/.claude/rules/private-key.md':
    '# Rule\n\n```\n-----BEGIN RSA PRIVATE KEY-----\n-----END RSA PRIVATE KEY-----\n```\n',
  // settings.json security: a wildcard Bash grant and the skip-permissions flag
  // each disable the approval gate. Kept on distinct paths so they don't collide
  // with the invalid-JSON fixture's `broken/.claude/settings.json` slot.
  'broken-perms/.claude/settings.json': '{ "permissions": { "allow": ["Bash(*)"] } }\n',
  'broken-skip/.claude/settings.json':
    '{ "permissions": { "allow": [] }, "extra": "--dangerously-skip-permissions" }\n',
  // Placeholder credential — MUST pass (proves no false positive on docs).
  'valid/.claude/rules/placeholder-key.md': '# Rule\n\nSet your key, e.g. `sk-ant-xxxxxxxxxxxxxxxxxxxx`, in the env.\n',
  'valid/.claude/skills/good/SKILL.md':
    '---\nname: sample-good-skill\ndescription: Minimal valid skill fixture for the validator test suite.\n---\n\nValid body.\n',
  // Progressive disclosure: a skill deferring detail to a references/ file that
  // no longer exists still loads, just without the part that mattered.
  'broken/.claude/skills/dangling-ref/SKILL.md':
    '---\nname: dangling-ref\ndescription: Defers detail to a references file that does not exist.\n---\n\nSee `references/gone.md` for the details.\n',
};

// Miniature repos for the full-scan mirror-integrity check. Each gets a real
// `.claude/rules/real.md`, its own `scripts/agent-mirrors.mjs` declaring one
// mirror (the validator resolves the manifest against `cwd`), and a
// `.cursor/rules/real.mdc` in exactly one state.
//
// `mirror` is the literal content to write, `symlinkTo` makes it a symlink
// instead, and omitting both leaves it absent. `source` defaults to the real
// rule; pointing it elsewhere covers a manifest that has gone stale. `mode`
// selects which rendering the manifest asks for.
// Unquoted scalar on purpose: the fixture lives inside this repo, so prettier
// resolves the repo's `singleQuote: true` for it, while the stub renderer emits
// JSON-quoted values. A plain scalar is stable under both.
const MIRROR_RULE = '---\ndescription: Real rule.\nalwaysApply: true\n---\n\n# Rule\n\nBody.\n';
const MIRROR_STUB =
  '---\ndescription: "Real rule."\nalwaysApply: true\n---\n\n' +
  '<!-- Generated by `npm run sync:agent-mirrors` — edit `.claude/rules/real.md` instead. -->\n\n' +
  '@.claude/rules/real.md\n';
const MIRROR_REPOS = {
  'mirror-healthy': { mirror: MIRROR_RULE, mode: 'copy' },
  'mirror-drifted': { mirror: `${MIRROR_RULE}\nEdited in the copy instead of the source.\n`, mode: 'copy' },
  'mirror-missing': { mode: 'copy' },
  // What a Windows checkout leaves behind: a regular file holding the old link
  // target, because Git for Windows defaults to `core.symlinks=false`.
  'mirror-flattened': { mirror: '../../.claude/rules/real.md\n', mode: 'copy' },
  // The pattern this design replaced — correct bytes, wrong mechanism.
  'mirror-symlink': { symlinkTo: '../../.claude/rules/real.md', mode: 'copy' },
  'mirror-missing-source': { mirror: MIRROR_RULE, mode: 'copy', source: '.claude/rules/moved-away.md' },
  // Stub mode: frontmatter plus an @ reference, no body.
  'mirror-stub-healthy': { mirror: MIRROR_STUB, mode: 'stub' },
  // A full copy where a stub was declared is drift, even though the bytes are the
  // source's own — Cursor would get a duplicated body that can go stale.
  'mirror-stub-is-copy': { mirror: MIRROR_RULE, mode: 'stub' },
};

const mirrorManifest = (source, mode) =>
  `export const AGENT_MIRRORS = [{ source: '${source}', mirrors: [{ path: '.cursor/rules/real.mdc', mode: '${mode}' }] }];\n` +
  `export const SYNC_COMMAND = 'npm run sync:agent-mirrors';\n` +
  `export const MIRROR_BY_PATH = new Map([['.cursor/rules/real.mdc', { source: '${source}', mode: '${mode}' }]]);\n`;

let fixturesRoot;
const fixture = (relPath) => join(fixturesRoot, relPath);

before(() => {
  // Prefix matches the `scripts/.agent-docs-fixtures*` entry in .prettierignore.
  fixturesRoot = mkdtempSync(join(here, '.agent-docs-fixtures-'));

  for (const [relPath, content] of Object.entries(FIXTURES)) {
    const full = fixture(relPath);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }

  for (const [name, { mirror, symlinkTo, mode, source = '.claude/rules/real.md' }] of Object.entries(MIRROR_REPOS)) {
    const rules = fixture(`${name}/.claude/rules`);
    const mirrorDir = fixture(`${name}/.cursor/rules`);
    const scripts = fixture(`${name}/scripts`);
    mkdirSync(rules, { recursive: true });
    mkdirSync(mirrorDir, { recursive: true });
    mkdirSync(scripts, { recursive: true });
    writeFileSync(join(rules, 'real.md'), MIRROR_RULE);
    writeFileSync(join(scripts, 'agent-mirrors.mjs'), mirrorManifest(source, mode));

    const entry = join(mirrorDir, 'real.mdc');
    if (symlinkTo) symlinkSync(symlinkTo, entry);
    else if (mirror !== undefined) writeFileSync(entry, mirror);
  }
});

after(() => rmSync(fixturesRoot, { recursive: true, force: true }));

// Always run from the repo root so prettier config / .prettierignore resolve as
// they do in CI. Explicit file args skip the repo-wide full-scan checks.
const run = (...files) => spawnSync('node', [script, ...files], { cwd: repoRoot, encoding: 'utf8' });

// Full scan inside a miniature repo, which is how the mirror-integrity walk runs.
const scan = (repo) => spawnSync('node', [script], { cwd: fixture(repo), encoding: 'utf8' });

const rejects = (relPath, pattern) => {
  const result = run(fixture(relPath));
  assert.equal(result.status, 1, `expected exit 1 for ${relPath}`);
  assert.match(result.stderr, pattern);
};

test('rejects broken frontmatter YAML', () => rejects('broken/.claude/skills/bad-yaml/SKILL.md', /frontmatter YAML/));

test('rejects an unterminated frontmatter block', () =>
  rejects('broken/.claude/skills/unterminated/SKILL.md', /unterminated frontmatter block/));

test('rejects a skill missing the name key', () =>
  rejects('broken/.claude/skills/missing-name/SKILL.md', /missing `name`/));

test('rejects a hidden/invisible character', () =>
  rejects('broken/.claude/rules/hidden-char.md', /hidden character U\+200B/));

test('rejects a Cursor `globs` key written as a list', () =>
  rejects('broken/.claude/rules/bad-globs.md', /must be a comma-separated string/));

test('rejects a broken @file reference', () =>
  rejects('broken/.claude/rules/missing-ref.md', /references missing file/));

test('rejects a skill pointing at a missing references/ file', () =>
  rejects('broken/.claude/skills/dangling-ref/SKILL.md', /points at missing `references\/gone\.md`/));

test('rejects invalid JSON', () => rejects('broken/.claude/settings.json', /JSON:/));

test('rejects a floating @latest MCP version', () => rejects('broken/.mcp.json', /floating package version/));

test('rejects duplicate Claude skill names', () => {
  const result = run(fixture('broken/.claude/skills/dup-a/SKILL.md'), fixture('broken/.claude/skills/dup-b/SKILL.md'));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /duplicates/);
});

test('rejects a committed AWS access key', () => rejects('broken/.claude/rules/aws-key.md', /AWS access key/));

test('rejects a committed private key', () => rejects('broken/.claude/rules/private-key.md', /private key/));

test('rejects an over-broad permission grant', () => rejects('broken-perms/.claude/settings.json', /wildcard grant/));

test('rejects the --dangerously-skip-permissions flag', () =>
  rejects('broken-skip/.claude/settings.json', /skip-permissions/));

test('accepts a placeholder credential in docs', () => {
  const result = run(fixture('valid/.claude/rules/placeholder-key.md'));
  assert.equal(result.status, 0, result.stderr);
});

test('accepts a valid skill', () => {
  const result = run(fixture('valid/.claude/skills/good/SKILL.md'));
  assert.equal(result.status, 0, result.stderr);
});

// The PostToolUse hook passes absolute paths; CI and pre-commit pass relative
// ones. Both must reach the same verdict, or prettier's .prettierignore silently
// applies to one caller and not the other.
test('treats an absolute path the same as a repo-relative one', () => {
  const rel = run('.claude/rules/a11y.md');
  const abs = run(join(repoRoot, '.claude/rules/a11y.md'));
  assert.equal(rel.status, 0, rel.stderr);
  assert.equal(abs.status, 0, abs.stderr);
});

test('accepts a mirror that matches its source', () => {
  const result = scan('mirror-healthy');
  assert.equal(result.status, 0, result.stderr);
});

test('rejects a mirror edited instead of its source', () => {
  const result = scan('mirror-drifted');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /has drifted from/);
});

test('rejects a missing mirror', () => {
  const result = scan('mirror-missing');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing generated mirror/);
});

test('rejects a flattened symlink left by a Windows checkout', () => {
  const result = scan('mirror-flattened');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /flattened symlink/);
});

// Its bytes are right, so the content check alone would pass it — and it is the
// one shape that breaks on a Windows clone.
test('rejects a mirror that is still a symlink', () => {
  const result = scan('mirror-symlink');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /is a symlink/);
});

test('rejects a manifest naming a source that no longer exists', () => {
  const result = scan('mirror-missing-source');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /mirror source but does not exist/);
});

test('accepts a stub that matches its rendering', () => {
  const result = scan('mirror-stub-healthy');
  assert.equal(result.status, 0, result.stderr);
});

// A stub's whole point is that the body lives in one place; a copy sitting where
// a stub belongs reintroduces exactly the duplication the mode exists to avoid.
test('rejects a full copy where a stub was declared', () => {
  const result = scan('mirror-stub-is-copy');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /has drifted from/);
});

// The full scan skips generated copies, so this is the only gate that catches an
// edit landing in one — which is exactly how the PostToolUse hook invokes it.
test('rejects editing a generated mirror directly', () => {
  const result = run('.cursor/rules/a11y.mdc');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /is generated from `\.claude\/rules\/a11y\.md`/);
});
