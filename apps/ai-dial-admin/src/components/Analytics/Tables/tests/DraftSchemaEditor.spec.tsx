import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import DraftSchemaEditor from '@/src/components/Analytics/Tables/DraftSchemaEditor';
import { createColumnRow } from '@/src/components/Analytics/Tables/utils';
import { useDraftSchemaForm } from '@/src/components/Analytics/Tables/use-draft-schema-form';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { AnalyticsTable, AnalyticsTableType, TableStatus } from '@/src/models/analytics/table';
import { DraftSchemaForm } from '@/src/models/analytics/tables-ui';

// Render DialTooltip content inline so the hint message is queryable (the real component only mounts
// its content on hover, via a portal), and swap DialSelectField for a native select so options and
// selection are queryable by role — the real one renders a custom listbox. Labels here are ReactNodes
// (label text + info tooltip), so the association is by `id` rather than an aria-label string.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialTooltip: ({ children, tooltip }: { children: ReactNode; tooltip?: ReactNode }) => (
      <>
        {children}
        {tooltip}
      </>
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    DialSelectField: ({ id, label, options, value, onChange, multiple, error }: any) => (
      <div>
        <label htmlFor={id}>{label}</label>
        <select
          id={id}
          multiple={multiple}
          value={value}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange={(e: any) => onChange(multiple ? [e.target.value] : e.target.value)}
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {options.map((o: any) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <span role="alert">{error}</span>}
      </div>
    ),
  };
});

// DraftSchemaEditor is purely presentational: it renders whatever `draft` (a useDraftSchemaForm result)
// hands it. A hand-built fixture keeps these tests focused on rendering/wiring, not on the hook's own
// validation/DTO logic (covered in use-draft-schema-form.spec.ts).
interface DraftOverrides extends Partial<DraftSchemaForm> {
  identityNames?: string[];
  versionNames?: string[];
  scanPairRequired?: boolean;
  scanPairIncomplete?: boolean;
}

const fixtureDraft = (overrides?: DraftOverrides): ReturnType<typeof useDraftSchemaForm> => {
  const { identityNames, versionNames, scanPairRequired, scanPairIncomplete, ...formOverrides } = overrides ?? {};
  const form: DraftSchemaForm = {
    columns: [createColumnRow()],
    orderingKey: [],
    partitionColumn: '',
    granularity: '',
    grainKey: '',
    identityColumn: '',
    versionColumn: '',
    ...formOverrides,
  };
  return {
    form,
    update: vi.fn(),
    columnOptions: [],
    temporalNames: [],
    identityNames: identityNames ?? [],
    versionNames: versionNames ?? [],
    grainOptions: [],
    columnErrors: [{}],
    scanPairRequired: scanPairRequired ?? false,
    scanPairIncomplete: scanPairIncomplete ?? false,
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

  test('the partition column label carries an info tooltip on the Date/Timestamp restriction', () => {
    render(<DraftSchemaEditor table={source} draft={fixtureDraft()} />);
    expect(screen.getByText(AnalyticsTablesI18nKey.PartitionColumnHint)).toBeInTheDocument();
  });

  test('hides Granularity until a partition column is chosen', () => {
    render(<DraftSchemaEditor table={source} draft={fixtureDraft()} />);
    expect(screen.queryByText(AnalyticsTablesI18nKey.Granularity)).not.toBeInTheDocument();
  });

  test('shows Granularity once a partition column is selected', () => {
    render(<DraftSchemaEditor table={source} draft={fixtureDraft({ partitionColumn: 'event_time' })} />);
    expect(screen.getByText(AnalyticsTablesI18nKey.Granularity)).toBeInTheDocument();
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

    // Required fields append a trailing "*" to the label, so match by substring rather than exact text.
    fireEvent.change(screen.getByLabelText(AnalyticsTablesI18nKey.ColumnName, { exact: false }), {
      target: { value: 'ts' },
    });

    expect(draft.update).toHaveBeenCalledWith('columns', expect.any(Array));
  });

  test('the column rows offer a Display name and a Description field', () => {
    render(<DraftSchemaEditor table={source} draft={fixtureDraft()} />);
    expect(screen.getByLabelText(AnalyticsTablesI18nKey.DisplayName, { exact: false })).toBeInTheDocument();
    expect(screen.getByLabelText(AnalyticsTablesI18nKey.Description, { exact: false })).toBeInTheDocument();
  });

  test('editing a column display name and description calls the draft update with the new rows', () => {
    const draft = fixtureDraft();
    render(<DraftSchemaEditor table={source} draft={draft} />);

    fireEvent.change(screen.getByLabelText(AnalyticsTablesI18nKey.DisplayName, { exact: false }), {
      target: { value: 'Total tokens' },
    });
    expect(draft.update).toHaveBeenCalledWith('columns', [expect.objectContaining({ display_name: 'Total tokens' })]);

    fireEvent.change(screen.getByLabelText(AnalyticsTablesI18nKey.Description, { exact: false }), {
      target: { value: 'Prompt plus completion tokens' },
    });
    expect(draft.update).toHaveBeenCalledWith('columns', [
      expect.objectContaining({ description: 'Prompt plus completion tokens' }),
    ]);
  });

  test('seeds the column rows with the display name and description a FAILED table already stores', () => {
    const seeded = fixtureDraft({
      columns: [
        {
          ...createColumnRow(),
          source_name: 'total_tokens',
          name: 'total_tokens',
          display_name: 'Total tokens',
          description: 'Prompt plus completion tokens',
        },
      ],
    });
    render(<DraftSchemaEditor table={{ ...source, status: TableStatus.Failed }} draft={seeded} />);

    expect(screen.getByLabelText(AnalyticsTablesI18nKey.DisplayName, { exact: false })).toHaveValue('Total tokens');
    expect(screen.getByLabelText(AnalyticsTablesI18nKey.Description, { exact: false })).toHaveValue(
      'Prompt plus completion tokens',
    );
  });

  test('renders no Save submit button — that trigger lives in the detail view header', () => {
    render(<DraftSchemaEditor table={source} draft={fixtureDraft()} />);
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'AnalyticsTables.Materialize' })).not.toBeInTheDocument();
  });

  test('renders both scan-metadata selects, each with its info tooltip', () => {
    render(<DraftSchemaEditor table={source} draft={fixtureDraft()} />);
    expect(screen.getByText(AnalyticsTablesI18nKey.IdentityColumn)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.VersionColumn)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.IdentityColumnHint)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTablesI18nKey.VersionColumnHint)).toBeInTheDocument();
  });

  test('offers the identity and version options the draft derived, plus an empty choice', () => {
    render(
      <DraftSchemaEditor
        table={source}
        draft={fixtureDraft({ identityNames: ['order_id', 'seen_at'], versionNames: ['seen_at'] })}
      />,
    );

    const identity = screen.getByLabelText(AnalyticsTablesI18nKey.IdentityColumn, { exact: false });
    expect(Array.from(identity.querySelectorAll('option')).map((o) => o.textContent)).toEqual([
      AnalyticsTablesI18nKey.PartitionNone,
      'order_id',
      'seen_at',
    ]);

    const version = screen.getByLabelText(AnalyticsTablesI18nKey.VersionColumn, { exact: false });
    expect(Array.from(version.querySelectorAll('option')).map((o) => o.textContent)).toEqual([
      AnalyticsTablesI18nKey.PartitionNone,
      'seen_at',
    ]);
  });

  test('choosing a scan-metadata column calls the draft update with that key', () => {
    const draft = fixtureDraft({ identityNames: ['order_id'] });
    render(<DraftSchemaEditor table={source} draft={draft} />);

    fireEvent.change(screen.getByLabelText(AnalyticsTablesI18nKey.IdentityColumn, { exact: false }), {
      target: { value: 'order_id' },
    });

    expect(draft.update).toHaveBeenCalledWith('identityColumn', 'order_id');
  });

  test('marks only the empty half when exactly one member is chosen', () => {
    render(
      <DraftSchemaEditor
        table={source}
        draft={fixtureDraft({
          identityColumn: 'order_id',
          identityNames: ['order_id'],
          versionNames: ['seen_at'],
          scanPairIncomplete: true,
        })}
      />,
    );
    expect(screen.getByText(AnalyticsTablesI18nKey.ScanPairIncomplete)).toBeInTheDocument();
  });

  test('a table that already stores a pair gets the required message, not the both-empty one', () => {
    render(
      <DraftSchemaEditor
        table={source}
        draft={fixtureDraft({ identityNames: ['order_id'], scanPairRequired: true, scanPairIncomplete: true })}
      />,
    );
    // Both halves are empty and neither may stay that way, so both carry the message.
    expect(screen.getAllByText(AnalyticsTablesI18nKey.ScanPairRequired)).toHaveLength(2);
    expect(screen.queryByText(AnalyticsTablesI18nKey.ScanPairIncomplete)).not.toBeInTheDocument();
  });

  test('shows no incomplete-pair message while the pair is complete or empty', () => {
    render(<DraftSchemaEditor table={source} draft={fixtureDraft()} />);
    expect(screen.queryByText(AnalyticsTablesI18nKey.ScanPairIncomplete)).not.toBeInTheDocument();
  });
});

describe('DraftSchemaEditor enrichment', () => {
  test('renders the grain-key select instead of ordering key/partition', () => {
    render(<DraftSchemaEditor table={enrichment} draft={fixtureDraft()} />);
    expect(screen.getByText(AnalyticsTablesI18nKey.GrainKey)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.OrderingKey)).not.toBeInTheDocument();
  });

  test('offers neither scan-metadata select — the backend rejects either member for an enrichment', () => {
    render(<DraftSchemaEditor table={enrichment} draft={fixtureDraft()} />);
    expect(screen.queryByText(AnalyticsTablesI18nKey.IdentityColumn)).not.toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.VersionColumn)).not.toBeInTheDocument();
  });
});
