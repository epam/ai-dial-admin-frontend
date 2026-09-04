import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import EvaluatorDetailView from '@/src/components/Analytics/Evaluators/EvaluatorDetailView';
import {
  AnalyticsEvaluatorsI18nKey,
  ButtonsI18nKey,
  CompareI18nKey,
  EntitiesI18nKey,
  TabsI18nKey,
} from '@/src/constants/i18n';
import { Evaluator, EvaluatorPreset, EvaluatorSummary, EvaluatorType } from '@/src/models/analytics/evaluator';

vi.mock('@/src/app/[lang]/evaluators/actions');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('@/src/components/Grid/GridView/GridView', () => ({ default: () => <div>rules grid</div> }));

// test-setup.tsx pins `jsonErrors` empty and hands out a fresh `showNotification` per call, so the marker
// gate needs its own controllable pair here.
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

// Monaco does not run under jsdom, so the editor is stubbed; its buttons stand in for the edits the real
// one delivers through setSelectedEntity.
vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => {
    mocks.editorProps.current = props;
    return (
      <div role="application" aria-label="JSON editor">
        <span>{JSON.stringify(props.entity)}</span>
        <button type="button" onClick={() => props.setSelectedEntity({ ...props.entity, model: 'gpt-4o' })}>
          edit-json
        </button>
        <button
          type="button"
          onClick={() => {
            const next = { ...props.entity };
            delete next.model;
            props.setSelectedEntity(next);
          }}
        >
          drop-model
        </button>
        {/* Re-reads the context without touching the draft, standing in for Monaco publishing new markers. */}
        <button type="button" onClick={() => props.setSelectedEntity({ ...props.entity })}>
          rerender
        </button>
      </div>
    );
  },
}));

const llm: Evaluator = {
  name: 'conversation-insights',
  version: 4,
  type: EvaluatorType.Llm,
  preset: EvaluatorPreset.ChatCompletion,
  model: 'gemini-2.5-flash-lite',
  params: { max_tokens: 700 },
  output_vars: [{ name: 'topic', type: 'string', jsonata: 'topic' }],
  created_at: '2026-08-19T10:00:00Z',
};

const summary: EvaluatorSummary = { name: llm.name, latest_version: 4 };

const renderView = () => render(<EvaluatorDetailView evaluator={llm} summary={summary} referencingPipelines={[]} />);

// The ui-kit switch puts role="switch" on a wrapper with no accessible name of its own, so the control is
// reached through the wrapper rather than by label.
const toggle = () => within(screen.getByRole('switch')).getByRole('checkbox');
const queryToggleRow = () => screen.queryByRole('switch');
const enableEditor = (user: ReturnType<typeof userEvent.setup>) => user.click(toggle());

beforeEach(() => {
  vi.clearAllMocks();
  mocks.jsonErrors = [];
  mocks.isFullAdmin.value = true;
  mocks.editorProps.current = {};
});

describe('EvaluatorDetailView — entering the JSON editor', () => {
  test('offers the toggle with nothing pending', () => {
    renderView();

    expect(queryToggleRow()).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.JSONEditor)).toBeInTheDocument();
  });

  test('enabling it replaces the fields with the editor', async () => {
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);

    expect(screen.getByRole('application', { name: 'JSON editor' })).toBeInTheDocument();
    expect(screen.queryByLabelText(AnalyticsEvaluatorsI18nKey.Model)).not.toBeInTheDocument();
  });

  test('the name and the version control remain', async () => {
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);

    expect(screen.getByRole('heading', { name: llm.name })).toBeInTheDocument();
    expect(screen.getByText(`${CompareI18nKey.Version} ${llm.version}`)).toBeInTheDocument();
  });

  test('the tabs are withdrawn', async () => {
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);

    expect(screen.queryByText(TabsI18nKey.Properties)).not.toBeInTheDocument();
    expect(screen.queryByText(TabsI18nKey.Rules)).not.toBeInTheDocument();
  });

  test('the JSON is seeded from the version on screen', async () => {
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);

    expect(mocks.editorProps.current.entity).toMatchObject({ name: llm.name, model: llm.model });
  });

  test('the JSON leaves out the fields the service assigns itself', async () => {
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);

    expect(mocks.editorProps.current.entity).not.toHaveProperty('version');
    expect(mocks.editorProps.current.entity).not.toHaveProperty('created_at');
  });

  test('the name is protected from edits in the editor', async () => {
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);

    expect(mocks.editorProps.current.ignoredFields).toEqual(['name']);
  });

  test('a full admin gets an editable editor', async () => {
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);

    expect(mocks.editorProps.current.readonly).toBe(false);
  });

  test('a caller without registration rights gets a read-only editor', async () => {
    mocks.isFullAdmin.value = false;
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);

    expect(mocks.editorProps.current.readonly).toBe(true);
  });

  test('a caller with read-only rights also loses the tabs', async () => {
    mocks.isFullAdmin.value = false;
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);

    expect(screen.queryByText(TabsI18nKey.Properties)).not.toBeInTheDocument();
    expect(screen.queryByText(TabsI18nKey.Rules)).not.toBeInTheDocument();
  });

  test('leaving the editor with nothing pending returns to the tab that was active', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByText(TabsI18nKey.Rules));
    expect(screen.getByText('rules grid')).toBeInTheDocument();

    await enableEditor(user);
    expect(screen.queryByText('rules grid')).not.toBeInTheDocument();

    await user.click(toggle());

    expect(screen.getByText('rules grid')).toBeInTheDocument();
  });
});

describe('EvaluatorDetailView — the identity row while a change is pending', () => {
  test('editing the JSON withdraws the toggle and offers Discard and Save', async () => {
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);
    await user.click(screen.getByRole('button', { name: 'edit-json' }));

    expect(queryToggleRow()).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Discard })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsEvaluatorsI18nKey.SaveAsNewVersion })).toBeInTheDocument();
  });

  test('breaking the JSON without changing the draft still offers Discard and Save', async () => {
    mocks.jsonErrors = [{ message: 'Expected comma', startLineNumber: 5 }];
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);

    expect(queryToggleRow()).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Discard })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsEvaluatorsI18nKey.SaveAsNewVersion })).toBeInTheDocument();
  });

  test('saving a broken document that never changed the draft reports the parse errors', async () => {
    mocks.jsonErrors = [{ message: 'Expected comma', startLineNumber: 5 }];
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);
    await user.click(screen.getByRole('button', { name: AnalyticsEvaluatorsI18nKey.SaveAsNewVersion }));

    expect(mocks.showNotification).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.CreateConfirmTitle)).not.toBeInTheDocument();
  });

  test('the toggle returns once the document parses again', async () => {
    mocks.jsonErrors = [{ message: 'Expected comma', startLineNumber: 5 }];
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);
    expect(queryToggleRow()).not.toBeInTheDocument();

    mocks.jsonErrors = [];
    await user.click(screen.getByRole('button', { name: 'rerender' }));

    expect(queryToggleRow()).toBeInTheDocument();
  });

  test('discarding restores the stored version and brings the toggle back', async () => {
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);
    await user.click(screen.getByRole('button', { name: 'edit-json' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));
    // The discard prompt confirms with the same label as the control that opened it, so the prompt's own
    // button is the second one on screen.
    const discardButtons = screen.getAllByRole('button', { name: ButtonsI18nKey.Discard });
    await user.click(discardButtons[discardButtons.length - 1]);

    expect(queryToggleRow()).toBeInTheDocument();
    expect(mocks.editorProps.current.entity).toMatchObject({ model: llm.model });
  });
});

describe('EvaluatorDetailView — submitting from the JSON editor', () => {
  const startEditing = async (user: ReturnType<typeof userEvent.setup>) => {
    await enableEditor(user);
    await user.click(screen.getByRole('button', { name: 'edit-json' }));
  };

  test('opens the same confirmation naming the predicted next version', async () => {
    const user = userEvent.setup();
    renderView();

    await startEditing(user);
    await user.click(screen.getByRole('button', { name: AnalyticsEvaluatorsI18nKey.SaveAsNewVersion }));

    expect(screen.getByText(AnalyticsEvaluatorsI18nKey.CreateConfirmTitle)).toBeInTheDocument();
    expect(screen.getByText(`${AnalyticsEvaluatorsI18nKey.NextVersion} 5`)).toBeInTheDocument();
  });

  test('JSON that does not parse is reported per line and opens no confirmation', async () => {
    mocks.jsonErrors = [
      { message: 'Expected comma', startLineNumber: 7 },
      { message: 'Unexpected token', startLineNumber: 9 },
    ];
    const user = userEvent.setup();
    renderView();

    await startEditing(user);
    await user.click(screen.getByRole('button', { name: AnalyticsEvaluatorsI18nKey.SaveAsNewVersion }));

    expect(mocks.showNotification).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.CreateConfirmTitle)).not.toBeInTheDocument();
  });

  test('the Save control stays enabled while the JSON does not parse', async () => {
    mocks.jsonErrors = [{ message: 'Expected comma', startLineNumber: 7 }];
    const user = userEvent.setup();
    renderView();

    await startEditing(user);

    expect(screen.getByRole('button', { name: AnalyticsEvaluatorsI18nKey.SaveAsNewVersion })).toBeEnabled();
  });

  test('the fields shape check does not disable Save while the editor is on', async () => {
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);

    // Dropping `model` makes `form.isValid` false. Routed through the stub's own button because setting the
    // state from the test body leaves the assertion reading the previous, still-valid draft.
    await user.click(screen.getByRole('button', { name: 'drop-model' }));

    expect(screen.getByRole('button', { name: AnalyticsEvaluatorsI18nKey.SaveAsNewVersion })).toBeEnabled();
  });
});
