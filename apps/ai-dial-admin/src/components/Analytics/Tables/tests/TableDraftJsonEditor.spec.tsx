import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { defineTableSchema, getTable, updateTable } from '@/src/app/[lang]/tables/actions';
import TableDetailView from '@/src/components/Analytics/Tables/TableDetailView';
import { AnalyticsTablesI18nKey, ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  AnalyticsTable,
  AnalyticsTableType,
  Cardinality,
  PartitionGranularity,
  TableStatus,
} from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/tables/actions');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

// The suite-wide SaveValidationContext mock pins `jsonErrors` empty; the marker cases need a
// controllable pair, and a `showNotification` this file can count.
const mocks = vi.hoisted(() => ({
  jsonErrors: [] as { message: string; startLineNumber: number }[],
  dispatch: vi.fn(),
  showNotification: vi.fn(() => 'notification-id'),
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
  useAppContext: () => ({ featureFlags: { analyticsEnabled: true } }),
}));

vi.mock('@/src/hooks/use-analytics-table-permissions', () => ({
  useAnalyticsTablePermissions: () => ({
    canCreate: true,
    canDelete: true,
    canManageRoles: true,
    canWrite: true,
    canModify: true,
  }),
}));

// The column form's own behavior is covered in DraftSchemaEditor.spec.tsx; here it stands in for "the
// column-by-column surface is on screen".
vi.mock('@/src/components/Analytics/Tables/DraftSchemaEditor', () => ({
  default: () => <div>draft-schema-editor</div>,
}));

// Stands in for the live column surface an activated table shows after the save refreshes the view.
vi.mock('@/src/components/Grid/GridView/GridView', () => ({ default: () => <div>columns-grid</div> }));

/**
 * Only Monaco is stubbed, so the real EntityJsonEditor runs: its parse, its identity guard and the whole
 * path from the typed document to the two request bodies take part. Stubbing EntityJsonEditor itself
 * would hide exactly that path — which is what this change adds.
 *
 * Uncontrolled on purpose: Monaco owns its buffer and is re-seeded by the editor's remount key, so a
 * controlled stub would fight the typing rather than reproduce it.
 */
vi.mock('@/src/components/Common/JsonEditorBase/JsonEditorBase', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ value, onChange }: any) => (
    <textarea aria-label="json document" defaultValue={value ?? ''} onChange={(e) => onChange(e.target.value)} />
  ),
}));

const sourceDraft = (overrides: Partial<AnalyticsTable> = {}): AnalyticsTable => ({
  name: 'dial_usage_log',
  type: AnalyticsTableType.Source,
  status: TableStatus.Pending,
  description: 'Raw usage events.',
  tag_order: ['core', 'billing'],
  ordering_key: ['event_id'],
  partition_by: { column: 'request_time', granularity: PartitionGranularity.Day },
  columns: [
    { source_name: 'event_id', name: 'event_id', type: AnalyticsFieldType.Uuid },
    { source_name: 'request_time', name: 'request_time', type: AnalyticsFieldType.Timestamp },
  ],
  ...overrides,
});

const enrichmentDraft = (): AnalyticsTable => ({
  name: 'conversation_insights',
  type: AnalyticsTableType.Enrichment,
  status: TableStatus.Pending,
  source_table: 'dial_usage_log',
  description: 'Insights per conversation.',
  tag_order: ['core'],
  grain: { grain_key: 'conversation_id', cardinality: Cardinality.ZeroOrOne },
  columns: [{ source_name: 'sentiment', name: 'sentiment', type: AnalyticsFieldType.String }],
});

const renderView = (initialTable: AnalyticsTable = sourceDraft()) =>
  render(<TableDetailView name={initialTable.name} initialTable={initialTable} apiBaseUrl="" flightUri="" />);

// Re-queried rather than cached: the editor may re-create the node, and a stale handle sends `paste` to
// document.body instead, which silently turns an assertion about typed text into an assertion about nothing.
const area = () => screen.getByLabelText('json document') as HTMLTextAreaElement;
const queryArea = () => screen.queryByLabelText('json document');
const documentOf = () => JSON.parse(area().value);
const saveButton = () => screen.getByRole('button', { name: ButtonsI18nKey.Save });
const toggle = () => within(screen.getByRole('switch')).getByRole('checkbox');

const openEditor = async (user: ReturnType<typeof userEvent.setup>) => user.click(toggle());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const write = async (user: ReturnType<typeof userEvent.setup>, next: any) => {
  await user.clear(area());
  await user.paste(JSON.stringify(next, null, 4));
};

const save = (user: ReturnType<typeof userEvent.setup>) => user.click(saveButton());

beforeEach(() => {
  vi.clearAllMocks();
  mocks.jsonErrors = [];
  vi.mocked(getTable).mockResolvedValue(null);
  vi.mocked(updateTable).mockResolvedValue({ success: true });
  vi.mocked(defineTableSchema).mockResolvedValue({ success: true });
});

describe('TableDetailView — entering the JSON editor on a draft', () => {
  // Renamed: an untouched PENDING draft's header offers no Save at all (see
  // TableDraftChangedHeader.spec.tsx) — this case's body never queried it and still holds.
  test('offers the toggle on an untouched PENDING table', () => {
    renderView();

    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.JSONEditor)).toBeInTheDocument();
  });

  test('offers the toggle on a FAILED table too', () => {
    renderView(sourceDraft({ status: TableStatus.Failed }));

    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  test('offers the JSON toggle on an ACTIVE table, but never the authoring editor', async () => {
    const user = userEvent.setup();
    renderView(sourceDraft({ status: TableStatus.Active }));

    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(queryArea()).not.toBeInTheDocument();

    await openEditor(user);

    // The toggle swaps in the read-only stored definition, not the draft's editable document: no Save
    // ever appears for an ACTIVE table, toggled or not.
    expect(area()).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).not.toBeInTheDocument();
  });

  test('activating the editor replaces the column-by-column surface', async () => {
    const user = userEvent.setup();
    renderView();
    expect(screen.getByText('draft-schema-editor')).toBeInTheDocument();

    await openEditor(user);

    expect(area()).toBeInTheDocument();
    expect(screen.queryByText('draft-schema-editor')).not.toBeInTheDocument();
  });

  test('toggling the editor off restores the column-by-column surface', async () => {
    const user = userEvent.setup();
    renderView();

    await openEditor(user);
    await user.click(toggle());

    expect(screen.getByText('draft-schema-editor')).toBeInTheDocument();
    expect(queryArea()).not.toBeInTheDocument();
  });

  test("the seeded document is the column form's schema plus the table's catalog metadata", async () => {
    const user = userEvent.setup();
    renderView();

    await openEditor(user);

    const document = documentOf();
    expect(document).toMatchObject({
      columns: [
        { source_name: 'event_id', name: 'event_id', type: AnalyticsFieldType.Uuid },
        { source_name: 'request_time', name: 'request_time', type: AnalyticsFieldType.Timestamp },
      ],
      ordering_key: ['event_id'],
      partition_by: { column: 'request_time', granularity: PartitionGranularity.Day },
      description: 'Raw usage events.',
      tag_order: ['core', 'billing'],
    });
    expect(document).not.toHaveProperty('identity_column');
    expect(document).not.toHaveProperty('version_column');
  });
});

describe('TableDetailView — the document is seeded once and kept', () => {
  test('an unrelated re-render leaves the edited document alone', async () => {
    const user = userEvent.setup();
    renderView();

    await openEditor(user);
    await write(user, { ...documentOf(), description: 'Edited in the editor.' });
    // Delete table is withdrawn once the draft is changed, so it can no longer stand in for "an
    // unrelated state change" here — opening and dismissing the discard confirmation is the state
    // change still available while the header is in its changed state.
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Discard }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.ContinueEditing }));

    expect(documentOf()).toMatchObject({ description: 'Edited in the editor.' });
  });

  // Skipped deliberately; the scenario it proved has been retired, not broken. The changed-entity
  // header withdraws the JSON-editor toggle the instant either surface is changed, so once a document
  // edit exists there is no control left to "leave" by — nothing turns it back on except Discard,
  // which restores the stored document, or a successful Save. The body is kept rather than deleted so
  // the path is cheap to restore if that ruling is ever reversed. See D10 in
  // openspec/changes/add-table-draft-schema-json-editor/design.md for the ruling and for how to
  // reverse it.
  test.skip('leaving and re-entering the editor shows the document as the author left it', async () => {
    const user = userEvent.setup();
    renderView();

    await openEditor(user);
    await write(user, { ...documentOf(), description: 'Edited in the editor.', retention_days: 7 });
    await user.click(toggle());
    await openEditor(user);

    expect(documentOf()).toMatchObject({ description: 'Edited in the editor.', retention_days: 7 });
  });

  // Skipped for the same mechanical reason as the case above — it needs the withdrawn toggle — but
  // note the difference: the guarantee this one proves, that a document edit does not change what the
  // column form submits, is still in the spec. Only this route to it is unreachable. Partial cover
  // lives in TableDraftChangedHeader.spec.tsx, for a document that is seeded but never edited; D10 in
  // openspec/changes/add-table-draft-schema-json-editor/design.md records exactly what is left
  // unproven.
  test.skip("a document edit leaves the column form's own submission unchanged", async () => {
    const user = userEvent.setup();
    renderView();

    await openEditor(user);
    await write(user, { ...documentOf(), description: 'Edited in the editor.', retention_days: 7 });
    await user.click(toggle());
    await save(user);

    expect(defineTableSchema).toHaveBeenCalledWith(
      'dial_usage_log',
      expect.not.objectContaining({ retention_days: 7 }),
    );
    expect(updateTable).not.toHaveBeenCalled();
  });
});

describe('TableDetailView — saving the draft document', () => {
  test("the column form's completeness rules do not gate Save in the editor", async () => {
    const user = userEvent.setup();
    // No columns and no ordering key: the column form would refuse to submit this draft — and an
    // unchanged draft offers no Save at all to check that against, so the claim is proved once inside
    // the editor with a change registered.
    renderView(sourceDraft({ columns: [], ordering_key: [], partition_by: undefined }));
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).not.toBeInTheDocument();

    await openEditor(user);
    await write(user, { ...documentOf(), description: 'Edited in the editor.' });

    expect(saveButton()).toBeEnabled();
    await save(user);

    expect(updateTable).toHaveBeenCalledOnce();
    expect(defineTableSchema).toHaveBeenCalledOnce();
  });

  test('the metadata request is sent before the schema request, each with its own members', async () => {
    const user = userEvent.setup();
    renderView();

    await openEditor(user);
    // A changed draft is a precondition for the header to offer Save at all; editing only the
    // metadata half of the document keeps the schema body exactly as seeded.
    await write(user, { ...documentOf(), description: 'Raw usage events, edited.' });
    await save(user);

    expect(updateTable).toHaveBeenCalledWith('dial_usage_log', {
      description: 'Raw usage events, edited.',
      tag_order: ['core', 'billing'],
    });
    // Exact, not `objectContaining`: the schema body must carry no catalog metadata at all.
    expect(defineTableSchema).toHaveBeenCalledWith('dial_usage_log', {
      columns: [
        { source_name: 'event_id', name: 'event_id', type: AnalyticsFieldType.Uuid, nullable: false },
        { source_name: 'request_time', name: 'request_time', type: AnalyticsFieldType.Timestamp, nullable: false },
      ],
      ordering_key: ['event_id'],
      partition_by: { column: 'request_time', granularity: PartitionGranularity.Day },
    });
    expect(vi.mocked(updateTable).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(defineTableSchema).mock.invocationCallOrder[0],
    );
  });

  test('a successful save refreshes the view onto the activated table', async () => {
    vi.mocked(getTable).mockResolvedValue(sourceDraft({ status: TableStatus.Active }));
    const user = userEvent.setup();
    renderView();

    await openEditor(user);
    await write(user, { ...documentOf(), description: 'Edited in the editor.' });
    await save(user);

    expect(mocks.showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: AnalyticsTablesI18nKey.TableActive }),
    );
    expect(await screen.findByText('columns-grid')).toBeInTheDocument();
    expect(queryArea()).not.toBeInTheDocument();
  });

  test('a failed metadata update blocks the schema request and reports the service error', async () => {
    vi.mocked(updateTable).mockResolvedValue({
      success: false,
      errorHeader: 'Conflict',
      errorMessage: 'tag_order references an unknown tag',
      requestId: 'req-1',
    });
    const user = userEvent.setup();
    renderView();

    await openEditor(user);
    await write(user, { ...documentOf(), description: 'Edited in the editor.' });
    await save(user);

    expect(defineTableSchema).not.toHaveBeenCalled();
    expect(mocks.showNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Conflict',
        description: 'tag_order references an unknown tag',
        requestId: 'req-1',
      }),
    );
  });

  test('a failed schema request leaves the document on the draft surface for a retry', async () => {
    vi.mocked(defineTableSchema).mockResolvedValue({
      success: false,
      errorHeader: 'Unprocessable entity',
      errorMessage: 'ordering_key references an unknown column',
    });
    const user = userEvent.setup();
    renderView();

    await openEditor(user);
    await write(user, { ...documentOf(), description: 'Second attempt.' });
    await save(user);

    expect(mocks.showNotification).toHaveBeenCalledWith(expect.objectContaining({ title: 'Unprocessable entity' }));
    expect(documentOf()).toMatchObject({ description: 'Second attempt.' });

    await save(user);

    expect(updateTable).toHaveBeenCalledTimes(2);
    expect(defineTableSchema).toHaveBeenCalledTimes(2);
  });
});

describe('TableDetailView — a document that does not parse', () => {
  test('parse markers block both requests and are raised as notifications', async () => {
    mocks.jsonErrors = [
      { message: 'Expected comma', startLineNumber: 4 },
      { message: 'Unexpected token', startLineNumber: 9 },
    ];
    const user = userEvent.setup();
    renderView();

    await openEditor(user);
    await save(user);

    expect(updateTable).not.toHaveBeenCalled();
    expect(defineTableSchema).not.toHaveBeenCalled();
    expect(mocks.showNotification).toHaveBeenCalledTimes(2);
    expect(mocks.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'SET_JSON_EDITOR_NOTIFICATIONS' }));
  });
});

describe("TableDetailView — pasting another environment's table response", () => {
  const readResponse = {
    name: 'conversation_insights_dev',
    type: 'enrichment',
    status: 'active',
    system: false,
    permissions: { write: true, modify: true },
    column_count: 1,
    source_table: 'dial_usage_log_dev',
    grain: { grain_key: 'conversation_id', cardinality: 'zero_or_one' },
    columns: [{ source_name: 'sentiment', name: 'sentiment', type: 'string' }],
    description: 'Copied from dev.',
    tag_order: ['core'],
    retention_days: 30,
  };

  test('the parsed document is split into the two request bodies', async () => {
    const user = userEvent.setup();
    renderView(enrichmentDraft());

    await openEditor(user);
    await write(user, readResponse);
    await save(user);

    expect(updateTable).toHaveBeenCalledWith('conversation_insights', {
      description: 'Copied from dev.',
      tag_order: ['core'],
    });
    expect(defineTableSchema).toHaveBeenCalledWith('conversation_insights', {
      grain_key: 'conversation_id',
      cardinality: 'zero_or_one',
      columns: [{ source_name: 'sentiment', name: 'sentiment', type: 'string' }],
      retention_days: 30,
    });
  });

  // Two-space indentation on purpose: the editor seeds its text with four, so a text rewritten from the
  // accepted parse — the cursor-resetting remount D2 guards against — would come back reformatted and fail
  // this. It is the one part of that guard jsdom can see.
  test('the editor keeps the pasted text byte for byte, dropped members included', async () => {
    const pasted = JSON.stringify(readResponse, null, 2);
    const user = userEvent.setup();
    renderView(enrichmentDraft());

    await openEditor(user);
    await user.clear(area());
    await user.paste(pasted);

    expect(area().value).toBe(pasted);
    expect(documentOf()).toHaveProperty('status', 'active');
    expect(documentOf()).toHaveProperty('grain');
  });
});
