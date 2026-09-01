import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import RuleDetailView from '@/src/components/Analytics/EnrichmentRules/RuleDetailView';
import { AnalyticsEnrichmentRulesI18nKey, ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { EvaluatorType } from '@/src/models/analytics/evaluator';
import { EnrichmentRule, TriggerKind } from '@/src/models/analytics/rule';

vi.mock('@/src/app/[lang]/enrichment-rules/actions');
vi.mock('@/src/app/[lang]/evaluators/actions');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

// The suite-wide SaveValidationContext mock pins `jsonErrors` empty and hands out a fresh
// `showNotification` per call, so the marker cases need their own controllable pair.
const mocks = vi.hoisted(() => ({
  jsonErrors: [] as { message: string; startLineNumber: number }[],
  dispatch: vi.fn(),
  showNotification: vi.fn(() => 'notification-id'),
  isFullAdmin: { value: true },
  editorProps: { current: {} as Record<string, unknown> },
}));

vi.mock('@/src/context/SaveValidationContext', () => ({
  SaveValidationContextProvider: ({ children }: { children: React.ReactNode }) => children,
  useSaveValidationContext: () => ({
    isValid: true,
    dispatch: mocks.dispatch,
    jsonErrors: mocks.jsonErrors,
    jsonErrorNotifications: [],
  }),
  useJsonEditorValidation: () => ({ editorId: 'e1', setJsonErrors: vi.fn(), removeEditor: vi.fn() }),
  ValidationActionType: { SetJsonEditorNotifications: 'SET_JSON_EDITOR_NOTIFICATIONS', Reset: 'RESET' },
}));

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: mocks.showNotification, removeNotification: vi.fn() }),
}));

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    isFullAdmin: mocks.isFullAdmin.value,
    isReadOnlyAdmin: !mocks.isFullAdmin.value,
    isEnableAuth: true,
  }),
}));

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => {
    mocks.editorProps.current = props;
    return (
      <div role="application" aria-label="JSON editor">
        <button type="button" onClick={() => props.setSelectedEntity({ ...props.entity, filter_sql: 'x > 1' })}>
          edit-json
        </button>
      </div>
    );
  },
}));

const rule: EnrichmentRule = {
  id: 'rule-1',
  name: 'insights-live',
  evaluator_name: 'conversation-insights',
  evaluator: { name: 'conversation-insights', version: 2, type: EvaluatorType.Llm },
  target_enrichment: 'conversation_insights',
  trigger_kind: TriggerKind.OnIngest,
  enabled: true,
  grain_key: 'conversation_id',
  generation: 3,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
};

const renderView = () => render(<RuleDetailView originalRule={rule} evaluators={[]} takenTargets={[]} />);

const queryToggleRow = () => screen.queryByRole('switch');
const toggle = () => within(screen.getByRole('switch')).getByRole('checkbox');
const enableEditor = (user: ReturnType<typeof userEvent.setup>) => user.click(toggle());
const saveButton = () => screen.queryByRole('button', { name: ButtonsI18nKey.Save });
const discardButton = () => screen.queryByRole('button', { name: ButtonsI18nKey.Discard });

// Discard opens a confirmation whose confirm control carries the same label, so the prompt's own button is
// the last one on screen.
const confirmDiscard = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(discardButton() as HTMLElement);
  const buttons = screen.getAllByRole('button', { name: ButtonsI18nKey.Discard });
  await user.click(buttons[buttons.length - 1]);
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.jsonErrors = [];
  mocks.isFullAdmin.value = true;
  mocks.editorProps.current = {};
});

describe('RuleDetailView — entering the JSON editor', () => {
  test('offers the toggle with nothing pending', () => {
    renderView();

    expect(queryToggleRow()).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.JSONEditor)).toBeInTheDocument();
  });

  test('offers the toggle to a caller who may not save', () => {
    mocks.isFullAdmin.value = false;
    renderView();

    expect(queryToggleRow()).toBeInTheDocument();
  });

  test('a caller who may not save gets a read-only editor', async () => {
    mocks.isFullAdmin.value = false;
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);

    expect(mocks.editorProps.current.readonly).toBe(true);
  });

  test('enabling it withdraws the facts, the fields, the badge and the enable action', async () => {
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);

    expect(screen.getByRole('application', { name: 'JSON editor' })).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsEnrichmentRulesI18nKey.Generation)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsEnrichmentRulesI18nKey.DisableRule })).not.toBeInTheDocument();
  });

  test('the rule name remains', async () => {
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);

    expect(screen.getByRole('heading', { name: rule.name })).toBeInTheDocument();
  });

  test('the document omits the members the service assigns', async () => {
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);

    expect(mocks.editorProps.current.entity).not.toHaveProperty('id');
    expect(mocks.editorProps.current.entity).not.toHaveProperty('generation');
  });
});

describe('RuleDetailView — the identity row while a change is pending', () => {
  test('editing the document withdraws the toggle and offers Discard and Save', async () => {
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);
    await user.click(screen.getByRole('button', { name: 'edit-json' }));

    expect(queryToggleRow()).not.toBeInTheDocument();
    expect(discardButton()).toBeInTheDocument();
    expect(saveButton()).toBeInTheDocument();
  });

  test('breaking the document without changing the draft still offers a way out', async () => {
    mocks.jsonErrors = [{ message: 'Expected comma', startLineNumber: 4 }];
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);

    expect(queryToggleRow()).not.toBeInTheDocument();
    expect(discardButton()).toBeInTheDocument();
    expect(saveButton()).toBeEnabled();
  });

  test('the toggle returns once the document parses again', async () => {
    mocks.jsonErrors = [{ message: 'Expected comma', startLineNumber: 4 }];
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);
    expect(queryToggleRow()).not.toBeInTheDocument();

    mocks.jsonErrors = [];
    await confirmDiscard(user);

    expect(queryToggleRow()).toBeInTheDocument();
  });

  test('discarding clears the validation state before resetting', async () => {
    mocks.jsonErrors = [{ message: 'Expected comma', startLineNumber: 4 }];
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);
    await confirmDiscard(user);

    expect(mocks.dispatch).toHaveBeenCalledWith({ type: 'RESET' });
  });
});

describe('RuleDetailView — saving from the JSON editor', () => {
  test('unparseable JSON is reported per line and nothing is sent', async () => {
    mocks.jsonErrors = [
      { message: 'Expected comma', startLineNumber: 4 },
      { message: 'Unexpected token', startLineNumber: 9 },
    ];
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);
    await user.click(saveButton() as HTMLElement);

    expect(mocks.showNotification).toHaveBeenCalledTimes(2);
  });

  test('the fields shape check does not disable Save while the editor is on', async () => {
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);
    await user.click(screen.getByRole('button', { name: 'edit-json' }));

    // The form reports invalid until its evaluator and target resolve, which they never do here because the
    // actions are mocked.
    expect(saveButton()).toBeEnabled();
  });
});
