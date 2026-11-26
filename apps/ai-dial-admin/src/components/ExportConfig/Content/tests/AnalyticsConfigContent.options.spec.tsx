import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColDef } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import AnalyticsConfigContent from '@/src/components/ExportConfig/Content/AnalyticsConfigContent';
import { ActionMenuOperationI18nKey } from '@/src/constants/i18n';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { AnalyticsExportEntityType } from '@/src/types/analytics/export';

vi.mock('@/src/app/[lang]/export-config/actions', () => ({ getAnalyticsEntities: vi.fn() }));

const ROW: EntitiesGridData = { name: 'usage_enrich' };

vi.mock('@/src/components/ExportConfig/Content/TabbedSelectionContent', () => ({
  default: ({
    getColDefs,
  }: {
    getColDefs: (tab: string, remove?: (entity?: EntitiesGridData) => void) => ColDef[];
  }) => {
    const editOf = (tab: string) =>
      (
        getColDefs(tab, vi.fn()).at(-1)?.cellRendererParams?.items as ActionMenuOperationDeclaration<EntitiesGridData>[]
      ).find(({ id }) => id === ActionMenuOperationI18nKey.Edit);
    const pipelineEdit = editOf('analytics-pipeline');
    const tableEdit = editOf('analytics-table');
    return (
      <>
        {pipelineEdit && (
          <button type="button" onClick={() => pipelineEdit.onClick?.({ name: 'usage_enrich' })}>
            edit-pipeline
          </button>
        )}
        {tableEdit && (
          <button type="button" onClick={() => tableEdit.onClick?.({ name: 'usage_base' })}>
            edit-table
          </button>
        )}
      </>
    );
  },
}));

vi.mock('@/src/components/ExportConfig/Content/AnalyticsRowOptionsModal', () => ({
  default: ({ entity, onApply }: { entity: EntitiesGridData; onApply: (entity: EntitiesGridData) => void }) => (
    <button type="button" onClick={() => onApply({ ...entity, isExportedAlone: true })}>
      apply-{entity.name}
    </button>
  ),
}));

describe('AnalyticsConfigContent — row options', () => {
  const setCustomExportData = vi.fn();

  const renderContent = (isAccessIncluded: boolean) =>
    render(
      <AnalyticsConfigContent
        customExportData={{}}
        setCustomExportData={setCustomExportData}
        isFull={false}
        isAccessIncluded={isAccessIncluded}
      />,
    );

  beforeEach(() => {
    setCustomExportData.mockReset();
  });

  test('offers Edit on pipeline rows always and on table rows only with access', () => {
    const { unmount } = renderContent(false);
    expect(screen.getByRole('button', { name: 'edit-pipeline' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'edit-table' })).toBeNull();
    unmount();

    renderContent(true);
    expect(screen.getByRole('button', { name: 'edit-table' })).toBeTruthy();
  });

  test('replaces the edited row by name in its tab once the popup is applied', async () => {
    const user = userEvent.setup();
    renderContent(false);

    await user.click(screen.getByRole('button', { name: 'edit-pipeline' }));
    await user.click(await screen.findByRole('button', { name: 'apply-usage_enrich' }));

    const update = setCustomExportData.mock.lastCall?.[0] as (
      prev: Record<string, EntitiesGridData[]>,
    ) => Record<string, EntitiesGridData[]>;
    expect(update({ [AnalyticsExportEntityType.PIPELINE]: [ROW, { name: 'usage_daily' }] })).toEqual({
      [AnalyticsExportEntityType.PIPELINE]: [{ name: 'usage_enrich', isExportedAlone: true }, { name: 'usage_daily' }],
    });
    expect(screen.queryByRole('button', { name: 'apply-usage_enrich' })).toBeNull();
  });
});
