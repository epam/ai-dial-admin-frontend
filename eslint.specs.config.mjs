// Spec-only lint. The main `eslint.config.mjs` ignores every `*.spec.ts(x)`, and un-ignoring them would
// surface rules nobody has agreed to for specs, so the timing idioms that made the suite flaky are guarded here
// on their own. Run by `npm run lint:specs` and, for staged specs, by lint-staged.
//
// Both shapes are described, with the replacement, in `.claude/rules/testing.md` §9.
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

const RULE = '.claude/rules/testing.md';

const BANNED_SYNTAX = [
  {
    // `waitFor(() => expect(mock).toHaveBeenCalled…)`, also with `.not.`, `…With(…)` and `…Times(…)`.
    selector:
      "CallExpression[callee.name='waitFor'] > ArrowFunctionExpression[body.type='CallExpression'][body.callee.property.name=/^toHaveBeenCalled/]",
    message: `Don't wait on a mock call: it says nothing about React having re-rendered. Await what the next line needs with findBy*; as a test's last statement use vi.waitFor (${RULE} §9.1).`,
  },
  {
    // The same wait written with a block body that holds only the mock assertion.
    selector:
      "CallExpression[callee.name='waitFor'] > ArrowFunctionExpression > BlockStatement > ExpressionStatement > CallExpression[callee.property.name=/^toHaveBeenCalled/]",
    message: `Don't wait on a mock call: it says nothing about React having re-rendered. Await what the next line needs with findBy*; as a test's last statement use vi.waitFor (${RULE} §9.1).`,
  },
  {
    // Any real timer: a sleep is shorter than the work it waits for on a loaded runner.
    selector: "CallExpression[callee.name='setTimeout']",
    message: `Don't sleep in a spec. Use fake timers (vi.useFakeTimers + vi.advanceTimersByTimeAsync), await the result with findBy*, or await act(async () => {}) to flush (${RULE} §9.3).`,
  },
];

export default [
  {
    ignores: ['**/node_modules/**', '**/.next/**', '**/.nx/**', '**/coverage/**', '**/dist/**'],
  },
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx'],
    // Specs carry `eslint-disable` comments for the app's rules. The plugins are registered, with none of their
    // rules switched on, so those comments resolve instead of erroring; they are not reported as unused either,
    // because this config enables a single rule.
    plugins: { '@typescript-eslint': tsPlugin, 'react-hooks': reactHooksPlugin },
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-restricted-syntax': ['error', ...BANNED_SYNTAX],
    },
  },
];
