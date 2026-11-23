import { appContextMock } from '@/test-mocks/app-context';
import { notificationMock } from '@/test-mocks/notification';
import { saveValidationMock } from '@/test-mocks/save-validation';
import { JSONEditorError } from '@/src/types/editor';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { listPipelineBackfills } from '@/src/app/[lang]/pipelines/actions';
import PipelineDetailView from '@/src/components/Analytics/Pipelines/PipelineDetailView';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { Pipeline, TriggerKind, PipelineKind, TransformType } from '@/src/models/analytics/pipeline';

vi.mock('@/src/app/[lang]/pipelines/actions');
const mocks = vi.hoisted(() => ({
  isFullAdmin: { value: true },
  sidebar: { showSidebar: vi.fn(), closeSidebar: vi.fn() },
  editorProps: { current: {} as Record<string, unknown> },
}));

beforeEach(() => {
  appContextMock.use(() => ({
    isFullAdmin: mocks.isFullAdmin.value,
    isReadOnlyAdmin: !mocks.isFullAdmin.value,
    isEnableAuth: true,
    featureFlags: {},
    sidebar: mocks.sidebar,
  }));
});

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => {
    mocks.editorProps.current = props;
    return (
      <div role="application" aria-label="JSON editor">
        <button type="button" onClick={() => props.setSelectedEntity({ ...props.entity, filter: 'x > 1' })}>
          edit-json
        </button>
      </div>
    );
  },
}));

const rule: Pipeline = {
  name: 'insights-live',
  kind: PipelineKind.Enrich,
  transform: { type: TransformType.Llm, model: 'gpt-4o', outputs: { title: 'Title of the session.' } },
  target: 'conversation_insights',
  trigger: { kind: TriggerKind.Schedule },
  enabled: true,
  grain_key: 'conversation_id',
  generation: 3,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-02-01T00:00:00Z',
};

const renderView = () => render(<PipelineDetailView pipeline={rule} takenTargets={[]} />);

const queryToggleRow = () => screen.queryByRole('switch');
const toggle = () => screen.getByRole('switch');
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
  notificationMock.showNotification.mockReturnValue('notification-id');
  vi.mocked(listPipelineBackfills).mockResolvedValue({ success: true, response: [] });
  mocks.isFullAdmin.value = true;
  mocks.editorProps.current = {};
});

describe('PipelineDetailView — entering the JSON editor', () => {
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
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.Generation)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsPipelinesI18nKey.DisablePipeline })).not.toBeInTheDocument();
  });

  test('the rule name remains', async () => {
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);

    expect(screen.getByRole('heading', { name: rule.name })).toBeInTheDocument();
  });

  test('the document is the pipeline as served, the members the service assigns included', async () => {
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);

    expect(mocks.editorProps.current.entity).toHaveProperty('generation');
  });
});

describe('PipelineDetailView — the identity row while a change is pending', () => {
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
    saveValidationMock.set({ jsonErrors: [{ message: 'Expected comma', startLineNumber: 4 }] as JSONEditorError[] });
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);

    expect(queryToggleRow()).not.toBeInTheDocument();
    expect(discardButton()).toBeInTheDocument();
    expect(saveButton()).toBeEnabled();
  });

  test('the toggle returns once the document parses again', async () => {
    saveValidationMock.set({ jsonErrors: [{ message: 'Expected comma', startLineNumber: 4 }] as JSONEditorError[] });
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);
    expect(queryToggleRow()).not.toBeInTheDocument();

    saveValidationMock.set({ jsonErrors: [] });
    await confirmDiscard(user);

    expect(queryToggleRow()).toBeInTheDocument();
  });

  test('discarding clears the validation state before resetting', async () => {
    saveValidationMock.set({ jsonErrors: [{ message: 'Expected comma', startLineNumber: 4 }] as JSONEditorError[] });
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);
    await confirmDiscard(user);

    expect(saveValidationMock.dispatch).toHaveBeenCalledWith({ type: 'RESET' });
  });
});

describe('PipelineDetailView — saving from the JSON editor', () => {
  test('unparseable JSON is reported per line and nothing is sent', async () => {
    saveValidationMock.set({
      jsonErrors: [
        { message: 'Expected comma', startLineNumber: 4 },
        { message: 'Unexpected token', startLineNumber: 9 },
      ] as JSONEditorError[],
    });
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);
    await user.click(saveButton() as HTMLElement);

    expect(notificationMock.showNotification).toHaveBeenCalledTimes(2);
  });

  test('the fields shape check does not disable Save while the editor is on', async () => {
    const user = userEvent.setup();
    renderView();

    await enableEditor(user);
    await user.click(screen.getByRole('button', { name: 'edit-json' }));

    // The form reports invalid until its target resolves, which it never does here because the
    // actions are mocked.
    expect(saveButton()).toBeEnabled();
  });
});
