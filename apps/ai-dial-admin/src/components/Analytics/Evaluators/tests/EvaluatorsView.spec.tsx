import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import EvaluatorsView from '@/src/components/Analytics/Evaluators/EvaluatorsView';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { AnalyticsEvaluatorsI18nKey } from '@/src/constants/i18n';
import { EvaluatorListRow } from '@/src/models/analytics/evaluator';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

interface MockColDef {
  headerName?: string;
  field?: string;
  colId?: string;
  sortable?: boolean;
  filter?: boolean;
  valueGetter?: (params: { data: EvaluatorListRow }) => unknown;
}

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({
    columnDefs,
    rowData,
    emptyDataProps,
    additionalGridOptions,
  }: {
    columnDefs?: MockColDef[];
    rowData?: EvaluatorListRow[];
    emptyDataProps?: { title?: string };
    additionalGridOptions?: { onCellClicked?: (e: { data?: EvaluatorListRow; event?: unknown }) => void };
  }) => {
    const dataColumns = columnDefs?.filter((col) => col.field !== ACTIONS_COLUMN_CEL_ID) ?? [];

    return (
      <div>
        <div>cols: {columnDefs?.map((col) => col.colId ?? col.field).join('|')}</div>
        <div>actions: {columnDefs?.some((col) => col.field === ACTIONS_COLUMN_CEL_ID) ? 'present' : 'absent'}</div>
        <div>sortable: {dataColumns.some((col) => col.sortable === false) ? 'disabled' : 'not-disabled'}</div>
        <div>filterable: {dataColumns.some((col) => col.filter === false) ? 'disabled' : 'not-disabled'}</div>
        {rowData?.length === 0 && <div>{emptyDataProps?.title}</div>}
        {rowData?.map((row) => (
          <div key={row.name}>
            <button onClick={() => additionalGridOptions?.onCellClicked?.({ data: row })}>{`open ${row.name}`}</button>
            {columnDefs
              ?.map((col) => {
                const value = col.valueGetter
                  ? col.valueGetter({ data: row })
                  : row[col.field as keyof EvaluatorListRow];
                return `${col.colId ?? col.field}=${String(value)}`;
              })
              .join(' ')}
          </div>
        ))}
      </div>
    );
  },
}));

const row = (over: Partial<EvaluatorListRow> = {}): EvaluatorListRow => ({
  name: 'conversation-insights',
  latest_version: 4,
  created_at: '2026-08-17T10:00:00Z',
  usedBy: 3,
  ...over,
});

const renderView = (props?: Partial<Parameters<typeof EvaluatorsView>[0]>) =>
  render(<EvaluatorsView rows={[row()]} {...props} />);

describe('EvaluatorsView', () => {
  test('renders the four columns', () => {
    renderView();

    expect(screen.getByText(/^cols:/)).toHaveTextContent('cols: name|latest_version|registeredAt|usedBy');
  });

  test('carries no type column', () => {
    renderView();

    expect(screen.getByText(/^cols:/).textContent).not.toMatch(/type/i);
  });

  test('carries no action column', () => {
    renderView();

    expect(screen.getByText(/^actions:/)).toHaveTextContent('actions: absent');
  });

  test('offers no create control', () => {
    renderView();

    expect(screen.queryByRole('button', { name: /create|new|add|edit|delete|remove/i })).toBeNull();
  });

  test('activating a row opens that evaluator', async () => {
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole('button', { name: 'open conversation-insights' }));

    expect(push).toHaveBeenCalledWith('/evaluators/conversation-insights');
  });

  test('leaves every data column sortable and filterable through the grid', () => {
    renderView();

    expect(screen.getByText(/^sortable:/)).toHaveTextContent('sortable: not-disabled');
    expect(screen.getByText(/^filterable:/)).toHaveTextContent('filterable: not-disabled');
  });

  test('renders no filter toolbar of its own', () => {
    renderView();

    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  test('reports the rule count for a referenced evaluator', () => {
    renderView();

    expect(screen.getByText(/usedBy=3/)).toBeTruthy();
  });

  test('reports zero as a value for an unreferenced evaluator', () => {
    renderView({ rows: [row({ usedBy: 0 })] });

    expect(screen.getByText(/usedBy=0/)).toBeTruthy();
  });

  test('reports the count as unknown rather than zero when the rules listing failed', () => {
    renderView({ rows: [row({ usedBy: null })], hasUsageError: true });

    expect(screen.queryByText(/usedBy=0/)).toBeNull();
    expect(screen.getByText(new RegExp(`usedBy=${AnalyticsEvaluatorsI18nKey.UsedByUnknown}`))).toBeTruthy();
  });

  test('states why the counts are unavailable', () => {
    renderView({ hasUsageError: true });

    expect(screen.getByText(AnalyticsEvaluatorsI18nKey.UsageLoadFailed)).toBeTruthy();
  });

  test('says nothing about usage when the rules listing succeeded', () => {
    renderView();

    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.UsageLoadFailed)).toBeNull();
  });

  test('renders an em dash for an evaluator reporting no registration timestamp', () => {
    renderView({ rows: [row({ created_at: undefined })] });

    expect(screen.getByText(new RegExp(`registeredAt=${UNAVAILABLE_VALUE}`))).toBeTruthy();
  });

  test('states a failed evaluators listing', () => {
    renderView({ hasLoadError: true });

    expect(screen.getByText(AnalyticsEvaluatorsI18nKey.EvaluatorsLoadFailed)).toBeTruthy();
  });

  test('renders an empty registry as an empty grid with no failure', () => {
    renderView({ rows: [] });

    expect(screen.getByText(AnalyticsEvaluatorsI18nKey.NoEvaluators)).toBeTruthy();
    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.EvaluatorsLoadFailed)).toBeNull();
  });
});
