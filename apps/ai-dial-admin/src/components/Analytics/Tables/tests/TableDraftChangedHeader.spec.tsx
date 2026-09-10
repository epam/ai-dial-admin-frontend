import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { defineTableSchema, updateTable } from '@/src/app/[lang]/tables/actions';
import TableDetailView from '@/src/components/Analytics/Tables/TableDetailView';
import { AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { AnalyticsTable, AnalyticsTableType, TableStatus } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/tables/actions');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const mocks = vi.hoisted(() => ({
  jsonErrors: [] as { message: string; startLineNumber: number }[],
  dispatch: vi.fn(),
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

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ featureFlags: { analyticsEnabled: true } }),
}));

const permissions = vi.hoisted(() => ({
  value: { canDelete: true, canWrite: true, canModify: true, canManageRoles: true },
}));

vi.mock('@/src/hooks/use-analytics-table-permissions', () => ({
  useAnalyticsTablePermissions: () => permissions.value,
}));

// Stands in for the live column surface on an ACTIVE table.
vi.mock('@/src/components/Grid/GridView/GridView', () => ({ default: () => <div>columns-grid</div> }));

// The column form's own behavior is covered in DraftSchemaEditor.spec.tsx; here it is a control that
// calls the same `draft.update` prop a real edit would, since an inert stand-in cannot drive a form
// edit — the shape both existing Tables specs mock it as.
vi.mock('@/src/components/Analytics/Tables/DraftSchemaEditor', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ draft }: any) => (
    <button type="button" onClick={() => draft.update('orderingKey', ['event_id', 'request_time'])}>
      edit-column-form
    </button>
  ),
}));

// Mocked one level up from JsonEditorBase, at the props boundary: this file proves the header's
// reaction to a document change, not the editor's own parse/seed mechanics (TableDraftJsonEditor.spec
// covers those over the real editor).
vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => (
    <div role="application" aria-label="JSON editor">
      <button type="button" onClick={() => props.setSelectedEntity({ ...props.entity, description: 'Edited.' })}>
        edit-json
      </button>
    </div>
  ),
}));

const sourceDraft = (overrides: Partial<AnalyticsTable> = {}): AnalyticsTable => ({
  name: 'dial_usage_log',
  type: AnalyticsTableType.Source,
  status: TableStatus.Pending,
  ordering_key: ['event_id'],
  columns: [
    { source_name: 'event_id', name: 'event_id', type: AnalyticsFieldType.Uuid },
    { source_name: 'request_time', name: 'request_time', type: AnalyticsFieldType.Timestamp },
  ],
  ...overrides,
});

const renderView = (initialTable: AnalyticsTable = sourceDraft()) =>
  render(<TableDetailView name={initialTable.name} initialTable={initialTable} apiBaseUrl="" flightUri="" />);

const jsonToggle = () => screen.queryByRole('switch');
const toggle = () => within(screen.getByRole('switch')).getByRole('checkbox');
const openEditor = (user: ReturnType<typeof userEvent.setup>) => user.click(toggle());
const editColumnForm = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'edit-column-form' }));
const editDocument = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'edit-json' }));

const saveButton = () => screen.queryByRole('button', { name: ButtonsI18nKey.Save });
const discardButton = () => screen.queryByRole('button', { name: ButtonsI18nKey.Discard });
const manageAccessButton = () => screen.queryByRole('button', { name: AnalyticsTablesI18nKey.ManageAccess });
const deleteButton = () => screen.queryByRole('button', { name: AnalyticsTablesI18nKey.DeleteTable });

// Discard opens a confirmation whose confirm control carries the same label as the header button, so
// the prompt's own button is the last one on screen.
const confirmDiscard = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(discardButton() as HTMLElement);
  const buttons = screen.getAllByRole('button', { name: ButtonsI18nKey.Discard });
  await user.click(buttons[buttons.length - 1]);
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.jsonErrors = [];
  permissions.value = { canDelete: true, canWrite: true, canModify: true, canManageRoles: true };
});

describe('TableDetailView — the changed-entity header', () => {
  test("editing the JSON document swaps the header's actions", async () => {
    const user = userEvent.setup();
    renderView();
    await openEditor(user);

    await editDocument(user);

    expect(discardButton()).toBeInTheDocument();
    expect(saveButton()).toBeInTheDocument();
    expect(manageAccessButton()).not.toBeInTheDocument();
    expect(deleteButton()).not.toBeInTheDocument();
    expect(jsonToggle()).not.toBeInTheDocument();
  });

  test("editing the column form swaps the header's actions", async () => {
    const user = userEvent.setup();
    renderView();

    await editColumnForm(user);

    expect(discardButton()).toBeInTheDocument();
    expect(saveButton()).toBeInTheDocument();
    expect(manageAccessButton()).not.toBeInTheDocument();
    expect(deleteButton()).not.toBeInTheDocument();
    expect(jsonToggle()).not.toBeInTheDocument();
  });

  test('an untouched draft keeps its ordinary header actions and offers neither Save nor Discard', () => {
    renderView();

    expect(manageAccessButton()).toBeInTheDocument();
    expect(deleteButton()).toBeInTheDocument();
    expect(jsonToggle()).toBeInTheDocument();
    expect(saveButton()).not.toBeInTheDocument();
    expect(discardButton()).not.toBeInTheDocument();
  });

  // The owner's decision (D9): shown when there are changes that make saving meaningful, not when the
  // status alone argues for a retry. Its own case, not folded into the untouched-draft case above.
  test('an untouched FAILED draft seeded from its stored definition offers no Save either', () => {
    renderView(sourceDraft({ status: TableStatus.Failed }));

    expect(saveButton()).not.toBeInTheDocument();
    expect(discardButton()).not.toBeInTheDocument();
    expect(manageAccessButton()).toBeInTheDocument();
    expect(deleteButton()).toBeInTheDocument();
    expect(jsonToggle()).toBeInTheDocument();
  });

  test('unresolved parse markers hold the changed header up even though the last parsed document is unchanged', async () => {
    mocks.jsonErrors = [{ message: 'Expected comma', startLineNumber: 4 }];
    const user = userEvent.setup();
    renderView();

    await openEditor(user);

    expect(discardButton()).toBeInTheDocument();
    expect(saveButton()).toBeInTheDocument();
    expect(manageAccessButton()).not.toBeInTheDocument();
  });

  test('confirming Discard restores both surfaces and keeps the editor as the active surface', async () => {
    const user = userEvent.setup();
    renderView();
    await openEditor(user);
    await editDocument(user);
    expect(discardButton()).toBeInTheDocument();

    await confirmDiscard(user);

    expect(saveButton()).not.toBeInTheDocument();
    expect(discardButton()).not.toBeInTheDocument();
    expect(manageAccessButton()).toBeInTheDocument();
    expect(deleteButton()).toBeInTheDocument();
    // Still the active surface: the JSON editor, not the column form.
    expect(screen.getByRole('application', { name: 'JSON editor' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'edit-column-form' })).not.toBeInTheDocument();
  });

  test('activating Discard requires confirmation, and dismissing it changes nothing', async () => {
    const user = userEvent.setup();
    renderView();
    await editColumnForm(user);
    expect(discardButton()).toBeInTheDocument();

    await user.click(discardButton() as HTMLElement);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.ContinueEditing }));

    expect(discardButton()).toBeInTheDocument();
    expect(saveButton()).toBeInTheDocument();
    expect(manageAccessButton()).not.toBeInTheDocument();
  });

  test('the changed header is offered only to a caller who may modify', async () => {
    permissions.value = { canDelete: true, canWrite: false, canModify: false, canManageRoles: true };
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('button', { name: 'edit-column-form' }));

    expect(saveButton()).not.toBeInTheDocument();
    expect(discardButton()).not.toBeInTheDocument();
    expect(manageAccessButton()).toBeInTheDocument();
    expect(deleteButton()).toBeInTheDocument();
  });

  // Replaces the retired "leaving and re-entering the editor keeps the edited document" scenario
  // (D10): the toggle is only reachable from an unchanged draft, so opening it without writing must
  // not mark the draft changed, and a later save from the column form must carry that form's own
  // body alone. Guards against `isDocumentChanged` comparing by reference: that bug would mark the
  // draft changed the moment the editor opens, even with no edit made.
  test('opening the editor and leaving it does not change what the column form submits', async () => {
    vi.mocked(defineTableSchema).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderView();

    await openEditor(user);

    expect(jsonToggle()).toBeInTheDocument();
    expect(manageAccessButton()).toBeInTheDocument();
    expect(deleteButton()).toBeInTheDocument();
    expect(saveButton()).not.toBeInTheDocument();
    expect(discardButton()).not.toBeInTheDocument();

    await openEditor(user);
    await editColumnForm(user);
    await user.click(saveButton() as HTMLElement);

    expect(defineTableSchema).toHaveBeenCalledWith('dial_usage_log', {
      columns: [
        { source_name: 'event_id', name: 'event_id', type: AnalyticsFieldType.Uuid, nullable: false },
        { source_name: 'request_time', name: 'request_time', type: AnalyticsFieldType.Timestamp, nullable: false },
      ],
      ordering_key: ['event_id', 'request_time'],
    });
    expect(updateTable).not.toHaveBeenCalled();
  });

  test("an ACTIVE table's header is untouched", () => {
    renderView(sourceDraft({ status: TableStatus.Active }));

    expect(discardButton()).not.toBeInTheDocument();
    expect(manageAccessButton()).toBeInTheDocument();
    expect(deleteButton()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddRows })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.Connect })).toBeInTheDocument();
  });
});
