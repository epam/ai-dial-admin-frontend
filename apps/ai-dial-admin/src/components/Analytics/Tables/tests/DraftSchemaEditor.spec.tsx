import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import DraftSchemaEditor from '@/src/components/Analytics/Tables/DraftSchemaEditor';
import { createColumnRow } from '@/src/components/Analytics/Tables/utils';
import { useDraftSchemaForm } from '@/src/components/Analytics/Tables/use-draft-schema-form';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { AnalyticsTable, AnalyticsTableType, TableStatus } from '@/src/models/analytics/table';
import { DraftSchemaForm } from '@/src/models/analytics/tables-ui';

// DraftSchemaEditor is purely presentational: it renders whatever `draft` (a useDraftSchemaForm result)
// hands it. A hand-built fixture keeps these tests focused on rendering/wiring, not on the hook's own
// validation/DTO logic (covered in use-draft-schema-form.spec.ts).
const fixtureDraft = (overrides?: Partial<DraftSchemaForm>): ReturnType<typeof useDraftSchemaForm> => {
  const form: DraftSchemaForm = {
    columns: [createColumnRow()],
    orderingKey: [],
    partitionColumn: '',
    granularity: '',
    grainKey: '',
    ...overrides,
  };
  return {
    form,
    update: vi.fn(),
    columnOptions: [],
    temporalNames: [],
    grainOptions: [],
    columnErrors: [{}],
    canMaterialize: false,
    buildDto: () => ({ columns: [] }),
  };
};

const source: AnalyticsTable = { name: 'orders', type: AnalyticsTableType.Source, status: TableStatus.Pending };
const enrichment: AnalyticsTable = {
  name: 'order_flags',
  type: AnalyticsTableType.Enrichment,
  source_table: 'orders',
  status: TableStatus.Pending,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DraftSchemaEditor source', () => {
  test('renders the columns section, ordering key, and partition controls', () => {
    render(<DraftSchemaEditor table={source} draft={fixtureDraft()} />);
    expect(screen.getByText(AnalyticsTablesI18nKey.Columns)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.OrderingKey)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.PartitionColumn)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.GrainKey)).not.toBeInTheDocument();
  });

  test('shows the failure hint for a FAILED table', () => {
    render(<DraftSchemaEditor table={{ ...source, status: TableStatus.Failed }} draft={fixtureDraft()} />);
    expect(screen.getByText(AnalyticsTablesI18nKey.ActivationFailedHint)).toBeInTheDocument();
  });

  test('shows no failure hint for a PENDING table', () => {
    render(<DraftSchemaEditor table={source} draft={fixtureDraft()} />);
    expect(screen.queryByText(AnalyticsTablesI18nKey.ActivationFailedHint)).not.toBeInTheDocument();
  });

  test('editing a column row calls the draft update with the new rows', () => {
    const draft = fixtureDraft();
    render(<DraftSchemaEditor table={source} draft={draft} />);

    fireEvent.change(screen.getByLabelText(AnalyticsTablesI18nKey.SourceName), { target: { value: 'ts' } });

    expect(draft.update).toHaveBeenCalledWith('columns', expect.any(Array));
  });

  test('renders no Save submit button — that trigger lives in the detail view header', () => {
    render(<DraftSchemaEditor table={source} draft={fixtureDraft()} />);
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'AnalyticsTables.Materialize' })).not.toBeInTheDocument();
  });
});

describe('DraftSchemaEditor enrichment', () => {
  test('renders the grain-key select instead of ordering key/partition', () => {
    render(<DraftSchemaEditor table={enrichment} draft={fixtureDraft()} />);
    expect(screen.getByText(AnalyticsTablesI18nKey.GrainKey)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.OrderingKey)).not.toBeInTheDocument();
  });
});
