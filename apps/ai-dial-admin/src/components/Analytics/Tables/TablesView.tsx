'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { ColDef } from 'ag-grid-community';
import {
  ConfirmationPopupVariant,
  DialConfirmationPopup,
  DialNeutralButton,
  DialPrimaryButton,
} from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';

import { deleteTable, getTables } from '@/src/app/[lang]/tables/actions';
import CreateTablePopup from '@/src/components/Analytics/Tables/CreateTablePopup';
import { navigateEntityUrl } from '@/src/components/EntityListView/utils/on-cell-clicked';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ACTION_COLUMN, ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { getDeleteOperation } from '@/src/constants/grid-columns/actions';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { AnalyticsTablesI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ActionMenuOperationDeclaration } from '@/src/models/action-menu-operations';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  initialTables: AnalyticsTable[];
}

const toDetailHref = (name: string): string => `${ApplicationRoute.AnalyticsTables}/${encodeURIComponent(name)}`;

const TablesView: FC<Props> = ({ initialTables }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();

  const [tables, setTables] = useState<AnalyticsTable[]>(initialTables);
  const [createType, setCreateType] = useState<AnalyticsTableType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const list = await getTables();
    if (Array.isArray(list)) setTables(list);
    else showNotification(getErrorNotification(t(AnalyticsTablesI18nKey.TablesLoadFailed)));
  }, [showNotification, t]);

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    const name = deleteTarget;
    setDeleteTarget(null);
    const res = await deleteTable(name);
    if (res.success) {
      showNotification(getSuccessNotification(t(AnalyticsTablesI18nKey.Deleted)));
      void reload();
    } else {
      showNotification(
        getErrorNotification(
          res.errorHeader || t(AnalyticsTablesI18nKey.ActionFailed),
          res.errorMessage,
          res.requestId,
        ),
      );
    }
  };

  const rowActions: ActionMenuOperationDeclaration<AnalyticsTable>[] = useMemo(
    () => [
      getDeleteOperation<AnalyticsTable>(
        (tbl) => tbl && setDeleteTarget(tbl.name),
        (_api, node) => Boolean((node.data as AnalyticsTable | undefined)?.system),
      ),
    ],
    [],
  );

  const columns: ColDef[] = useMemo(
    () => [
      { headerName: t(AnalyticsTablesI18nKey.Name), field: 'name', flex: 2 },
      { headerName: t(AnalyticsTablesI18nKey.Type), field: 'type', flex: 1 },
      { headerName: t(AnalyticsTablesI18nKey.Description), field: 'description', flex: 3 },
      {
        headerName: t(AnalyticsTablesI18nKey.ColumnsCount),
        colId: 'columnsCount',
        flex: 1,
        valueGetter: (params) => (params.data as AnalyticsTable | undefined)?.columns?.length ?? 0,
      },
      {
        headerName: t(AnalyticsTablesI18nKey.System),
        colId: 'system',
        flex: 1,
        valueGetter: (params) =>
          (params.data as AnalyticsTable | undefined)?.system ? t(AnalyticsTablesI18nKey.System) : '',
      },
      ACTION_COLUMN(rowActions),
    ],
    [t, rowActions],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 relative">
      <div className="flex flex-row mb-8 justify-between items-center gap-4 h-[40px]">
        <h1>{t(MenuI18nKey.Tables)}</h1>
        <div className="flex items-center gap-4">
          <DialNeutralButton
            label={t(AnalyticsTablesI18nKey.CreateEnrichment)}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            onClick={() => setCreateType(AnalyticsTableType.Enrichment)}
          />
          <DialPrimaryButton
            label={t(AnalyticsTablesI18nKey.CreateSource)}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            onClick={() => setCreateType(AnalyticsTableType.Source)}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <GridView
          columnDefs={columns}
          rowData={tables}
          getRowId={(params) => params.data.name}
          additionalGridOptions={{
            onCellClicked: (e) => {
              if (e.colDef.field === ACTIONS_COLUMN_CEL_ID || !e.data) return;
              navigateEntityUrl(toDetailHref(e.data.name), router.push, e.event as MouseEvent | undefined);
            },
          }}
          emptyDataProps={{ title: t(AnalyticsTablesI18nKey.NoTables) }}
        />
      </div>

      {deleteTarget && (
        <DialConfirmationPopup
          open={!!deleteTarget}
          variant={ConfirmationPopupVariant.Danger}
          header={t(AnalyticsTablesI18nKey.DeleteConfirmTitle)}
          description={t(AnalyticsTablesI18nKey.DeleteConfirmDescription)}
          confirmLabel={t(AnalyticsTablesI18nKey.DeleteTable)}
          onConfirm={() => void onConfirmDelete()}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {createType !== null && (
        <CreateTablePopup
          tableType={createType}
          tables={tables}
          onClose={() => setCreateType(null)}
          onCreated={() => void reload()}
        />
      )}
    </div>
  );
};

export default TablesView;
