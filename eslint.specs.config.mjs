// Spec-only lint. The main `eslint.config.mjs` ignores every `*.spec.ts(x)`, and un-ignoring them would
// surface rules nobody has agreed to for specs, so the timing idioms that made the suite flaky are guarded here
// on their own. Run by `npm run lint:specs` and, for staged specs, by lint-staged.
//
// Both shapes are described, with the replacement, in `.claude/rules/testing.md` §9.
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

const RULE = '.claude/rules/testing.md';
const GLOBAL_OBJECTS = '/^(global|globalThis|window|navigator|localStorage|sessionStorage)$/';
const CONTROLLED_MODULES =
  '/^(next\\/navigation|@\\/src\\/context\\/(SaveValidationContext|AppContext|NotificationContext))$/';

const BANNED_SYNTAX = [
  {
    // `waitFor(() => expect(mock).toHaveBeenCalled…)`, also with `.not.`, `…With(…)` and `…Times(…)`.
    selector:
      "CallExpression[callee.name='waitFor'] > ArrowFunctionExpression[body.type='CallExpression'][body.callee.property.name=/^toHaveBeenCalled/]",
    message: `Don't wait on a mock call: it says nothing about React having re-rendered. Await what the next line needs with findBy*; as a test's last statement use vi.waitFor (${RULE} §9 rule 1).`,
  },
  {
    // The same wait written with a block body that holds only the mock assertion.
    selector:
      "CallExpression[callee.name='waitFor'] > ArrowFunctionExpression > BlockStatement > ExpressionStatement > CallExpression[callee.property.name=/^toHaveBeenCalled/]",
    message: `Don't wait on a mock call: it says nothing about React having re-rendered. Await what the next line needs with findBy*; as a test's last statement use vi.waitFor (${RULE} §9 rule 1).`,
  },
  {
    // A click or a keystroke inside waitFor runs again on every retry.
    selector:
      "CallExpression[callee.name='waitFor'] CallExpression[callee.object.name=/^(user|userEvent|fireEvent)$/][callee.property.name!='setup'], CallExpression[callee.name='waitFor'] CallExpression[callee.object.callee.object.name='userEvent']",
    message: `Don't act inside waitFor: it is retried, so the action repeats. Do the action first, then wait for its result (${RULE} §9 rule 2).`,
  },
  {
    // A longer timeout hides a test that mounts too much or waits on the wrong thing.
    selector:
      "CallExpression[callee.name=/^(waitFor|waitForElementToBeRemoved)$/] > ObjectExpression > Property[key.name='timeout'], CallExpression[callee.property.name=/^(findBy|findAllBy)/] > ObjectExpression > Property[key.name='timeout'], CallExpression[callee.name=/^(findBy|findAllBy)/] > ObjectExpression > Property[key.name='timeout']",
    message: `Don't raise a wait's timeout to fix a slow test; find why it is slow or what it should wait for (${RULE} §9 rule 2).`,
  },
  {
    // Any real timer: a sleep is shorter than the work it waits for on a loaded runner.
    selector: "CallExpression[callee.name='setTimeout']",
    message: `Don't sleep in a spec. Use fake timers (vi.useFakeTimers + vi.advanceTimersByTimeAsync), await the result with findBy*, or await act(async () => {}) to flush (${RULE} §9 rule 3).`,
  },
  {
    // Files share one environment, and only vi.stubGlobal is undone by the global cleanup.
    selector: `AssignmentExpression[left.object.name=${GLOBAL_OBJECTS}], AssignmentExpression[left.object.object.name=${GLOBAL_OBJECTS}], CallExpression[callee.object.name='Object'][callee.property.name='assign'][arguments.0.name=${GLOBAL_OBJECTS}]`,
    message: `Don't assign to a global in a spec: the next file inherits it. Use vi.stubGlobal in beforeEach, or vi.spyOn on the object (${RULE} §10).`,
  },
  {
    // Same for the environment: only vi.stubEnv is undone by the global cleanup.
    selector:
      "AssignmentExpression[left.object.object.name='process'][left.object.property.name='env'], UnaryExpression[operator='delete'][argument.object.object.name='process'][argument.object.property.name='env']",
    message: `Don't write process.env in a spec: the next file inherits it. Use vi.stubEnv (${RULE} §10).`,
  },
  {
    // These modules have a controller in apps/ai-dial-admin/test-mocks; a second mock would shadow it.
    selector: `CallExpression[callee.object.name='vi'][callee.property.name=/^(mock|doMock)$/][arguments.0.value=${CONTROLLED_MODULES}]`,
    message: `This module is mocked once in test-setup.tsx through a controller in test-mocks/. Configure it with that controller (appContextMock, navigationMock, notificationMock, saveValidationMock) instead of mocking it again (${RULE} §10).`,
  },
  {
    // The hook only reads AppContext, which already has a controller.
    selector:
      "CallExpression[callee.object.name='vi'][callee.property.name=/^(mock|doMock)$/][arguments.0.value='@/src/hooks/use-is-read-only-admin']",
    message: `useIsReadOnlyAdmin reads AppContext; set the state with appContextMock.set({ isReadOnlyAdmin: true }) instead of mocking the hook (${RULE} §10).`,
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
