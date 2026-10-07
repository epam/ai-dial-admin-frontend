import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColDef, GridApi, IRowNode } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';

import AnalyticsImportGrid from '@/src/components/ImportConfig/ConfigurationPreview/AnalyticsImportGrid';
import { getAnalyticsImportRows } from '@/src/components/ImportConfig/ConfigurationPreview/analytics-import.utils';
import { ActionMenuOperationI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { CatalogImportResult } from '@/src/models/analytics/catalog-import';
import { CatalogImportAction, CatalogImportOutcome, CatalogImportStatus } from '@/src/types/analytics/import';

// AG Grid renders no rows in jsdom; this stand-in prints each row's cells and its visible row actions.
vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ columnDefs, rowData }: { columnDefs: ColDef[]; rowData: object[] }) => (
    <table>
      <tbody>
        {rowData.map((row, index) => (
          <tr key={index}>
            {columnDefs.map((col) => {
              const items = col.cellRendererParams?.items as ActionMenuOperationDeclaration<object>[] | undefined;
              if (items) {
                return (
                  <td key="actions">
                    {items
                      .filter((item) => !item.hidden?.({} as GridApi, { data: row } as IRowNode))
                      .map((item) => (
                        <button key={item.id} type="button" onClick={() => item.onClick(row)}>
                          {item.label}
                        </button>
                      ))}
                  </td>
                );
              }
              return <td key={col.field}>{String((row as Record<string, unknown>)[col.field as string] ?? '')}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

vi.mock('@/src/components/ActivityAudit/Modals/Details', () => ({
  default: ({ rollBackState, currentState }: { rollBackState: object; currentState: object }) => (
    <p>{`compare ${JSON.stringify(rollBackState)} -> ${JSON.stringify(currentState)}`}</p>
  ),
}));

const t = (key: string) => key;

const RESULT: CatalogImportResult = {
  import_id: 'i-1',
  outcome: CatalogImportOutcome.ROLLED_BACK,
  required_system_tables: [],
  pipelines: [],
  env_specific: [],
  tables: [
    {
      name: 'usage_sentiment',
      import_action: CatalogImportAction.SKIP,
      prev: { v: 1 },
      next: { v: 2 },
      differs: true,
      status: CatalogImportStatus.SKIPPED,
    },
    { name: 'json_source', import_action: CatalogImportAction.CREATE, status: CatalogImportStatus.ROLLED_BACK },
    { name: 'broken', import_action: CatalogImportAction.FAIL, problems: ['already exists'] },
  ],
};

describe('AnalyticsImportGrid', () => {
  test('shows each row action, the translated status, and Compare only where an object exists', () => {
    render(<AnalyticsImportGrid rows={getAnalyticsImportRows(RESULT, t)} hasResult />);

    expect(screen.getByText('Fail')).toBeInTheDocument();
    expect(screen.getByText('already exists')).toBeInTheDocument();
    expect(screen.getByText(ImportI18nKey.AnalyticsStatusRolledBack)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: ActionMenuOperationI18nKey.Compare_changes })).toHaveLength(1);
  });

  test('opens the diff with the stored object as roll-back state and the bundle object as current', async () => {
    const user = userEvent.setup();
    render(<AnalyticsImportGrid rows={getAnalyticsImportRows(RESULT, t)} hasResult={false} />);

    await user.click(screen.getByRole('button', { name: ActionMenuOperationI18nKey.Compare_changes }));

    expect(screen.getByText('compare {"v":1} -> {"v":2}')).toBeInTheDocument();
  });

  test('hides the Status column without a result', () => {
    render(<AnalyticsImportGrid rows={getAnalyticsImportRows(RESULT, t)} hasResult={false} />);

    expect(screen.queryByText(ImportI18nKey.AnalyticsStatusRolledBack)).toBeNull();
  });
});
