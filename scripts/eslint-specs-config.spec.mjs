// Tests the spec-only lint config: that the banned timing idioms are reported, and that the replacements
// `.claude/rules/testing.md` §9 prescribes are not. A selector that is too wide blocks legitimate waits; one that
// is too narrow lets the flaky shapes back in, so both directions are covered.
//
// Run: npm run test:scripts

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const eslint = new ESLint({ cwd: repoRoot, overrideConfigFile: join(repoRoot, 'eslint.specs.config.mjs') });

const lint = async (source) => {
  const [result] = await eslint.lintText(source, {
    filePath: join(repoRoot, 'apps/ai-dial-admin/src/example.spec.tsx'),
  });
  return result.messages;
};

const BANNED = {
  'a mock-call waitFor': 'await waitFor(() => expect(save).toHaveBeenCalled());',
  'a mock-call waitFor with arguments': "await waitFor(() => expect(save).toHaveBeenCalledWith('a'));",
  'a mock-call waitFor with a count': 'await waitFor(() => expect(save).toHaveBeenCalledTimes(2));',
  'a mock-call waitFor with once': 'await waitFor(() => expect(save).toHaveBeenCalledOnce());',
  'a negated mock-call waitFor': 'await waitFor(() => expect(save).not.toHaveBeenCalled());',
  'a block-bodied mock-call waitFor': 'await waitFor(() => {\n  expect(save).toHaveBeenCalled();\n});',
  'a click inside waitFor': "await waitFor(() => {\n  user.click(screen.getByRole('button'));\n});",
  'a fireEvent inside waitFor': "await waitFor(() => fireEvent.click(screen.getByRole('button')));",
  'a userEvent call inside waitFor': "await waitFor(() => userEvent.click(screen.getByRole('button')));",
  'a timeout on waitFor': 'await waitFor(() => expect(value).toBe(1), { timeout: 5000 });',
  'a timeout on findBy': "await screen.findByText('x', {}, { timeout: 5000 });",
  'a timeout on waitForElementToBeRemoved': 'await waitForElementToBeRemoved(el, { timeout: 5000 });',
  'a real sleep': 'await new Promise((resolve) => setTimeout(resolve, 50));',
  'a bare setTimeout': 'setTimeout(() => done(), 10);',
};

const ALLOWED = {
  'findBy for an element': "expect(await screen.findByRole('button')).toBeTruthy();",
  "Vitest's vi.waitFor on a mock": 'await vi.waitFor(() => expect(save).toHaveBeenCalled());',
  'waitFor on an enabled state': "await waitFor(() => expect(screen.getByRole('button')).toBeEnabled());",
  'waitFor on a count of elements': "await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(3));",
  'waitFor on renderHook state': 'await waitFor(() => expect(result.current.isLoading).toBe(false));',
  'a block waitFor on one non-mock condition':
    "await waitFor(() => {\n  expect(screen.getByRole('status')).toBeTruthy();\n});",
  'findBy with a name option': "expect(await screen.findByRole('button', { name: 'Save' })).toBeTruthy();",
  'a click before waitFor': 'await user.click(button);\nawait waitFor(() => expect(button).toBeEnabled());',
  'advancing fake timers': 'await vi.advanceTimersByTimeAsync(150);',
  'a microtask flush': 'await act(async () => {});',
};

for (const [name, source] of Object.entries(BANNED)) {
  test(`reports ${name}`, async () => {
    const messages = await lint(source);

    assert.equal(messages.length, 1, JSON.stringify(messages));
    assert.equal(messages[0].ruleId, 'no-restricted-syntax');
    assert.match(messages[0].message, /testing\.md/);
  });
}

for (const [name, source] of Object.entries(ALLOWED)) {
  test(`allows ${name}`, async () => {
    assert.deepEqual(await lint(source), []);
  });
}

test('resolves eslint-disable comments for the application rules instead of erroring', async () => {
  const source =
    '// eslint-disable-next-line @typescript-eslint/no-explicit-any\nconst value: any = 1;\nexport { value };';

  assert.deepEqual(await lint(source), []);
});

test('does not lint non-spec files', async () => {
  const [result] = await eslint.lintText('setTimeout(() => {}, 1);', {
    filePath: join(repoRoot, 'apps/ai-dial-admin/src/example.ts'),
    warnIgnored: false,
  });

  assert.deepEqual(result?.messages ?? [], []);
});

test('reports a userEvent.setup() call inside waitFor', async () => {
  const messages = await lint("await waitFor(() => userEvent.setup().click(screen.getByRole('button')));");

  assert.equal(messages.length, 1, JSON.stringify(messages));
  assert.equal(messages[0].ruleId, 'no-restricted-syntax');
});
