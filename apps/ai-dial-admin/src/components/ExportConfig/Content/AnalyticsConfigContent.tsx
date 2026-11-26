'use client';
import { Dispatch, FC, SetStateAction, useCallback, useMemo, useState } from 'react';

import { getAnalyticsEntities } from '@/src/app/[lang]/export-config/actions';
import { getButtonTitle } from '@/src/components/ExportConfig/AddEntities/utils';
import AnalyticsRowOptionsModal from '@/src/components/ExportConfig/Content/AnalyticsRowOptionsModal';
import TabbedSelectionContent from '@/src/components/ExportConfig/Content/TabbedSelectionContent';
import { getAnalyticsColDefs, getAnalyticsTabs } from '@/src/components/ExportConfig/analytics-utils';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { AnalyticsExportEntityType } from '@/src/types/analytics/export';

interface Props {
  customExportData: Record<string, EntitiesGridData[]>;
  setCustomExportData: Dispatch<SetStateAction<Record<string, EntitiesGridData[]>>>;
  isFull: boolean;
  isAccessIncluded: boolean;
}

interface EditedRow {
  tab: AnalyticsExportEntityType;
  entity: EntitiesGridData;
}

const AnalyticsConfigContent: FC<Props> = ({ customExportData, setCustomExportData, isFull, isAccessIncluded }) => {
  const t = useI18n();
  const [editedRow, setEditedRow] = useState<EditedRow>();

  const tabs = useMemo(() => getAnalyticsTabs(t), [t]);

  const getColDefs = useCallback(
    (tab: string, remove?: (entity?: EntitiesGridData) => void) =>
      getAnalyticsColDefs(t, tab, isAccessIncluded, remove, (entity) => {
        if (entity) setEditedRow({ tab: tab as AnalyticsExportEntityType, entity });
      }),
    [t, isAccessIncluded],
  );
  const getAddButtonTitle = useCallback(
    (tab: string) => getButtonTitle(t, tab as AnalyticsExportEntityType, true),
    [t],
  );
  const getEmptyTitle = useCallback(() => t(EntitiesI18nKey.NoEntities), [t]);
  const loadCandidates = useCallback((tab: string) => getAnalyticsEntities(tab, isAccessIncluded), [isAccessIncluded]);

  const onApplyRowOptions = useCallback(
    (updated: EntitiesGridData) => {
      if (!editedRow) return;
      const { tab } = editedRow;
      setCustomExportData((prev) => ({
        ...prev,
        [tab]: (prev[tab] ?? []).map((row) => (row.name === updated.name ? updated : row)),
      }));
      setEditedRow(undefined);
    },
    [editedRow, setCustomExportData],
  );

  return (
    <>
      <TabbedSelectionContent
        key={String(isAccessIncluded)}
        tabs={tabs}
        customExportData={customExportData}
        setCustomExportData={setCustomExportData}
        loadCandidates={loadCandidates}
        getColDefs={getColDefs}
        getAddButtonTitle={getAddButtonTitle}
        getEmptyTitle={getEmptyTitle}
        isFull={isFull}
      />
      {editedRow && (
        <AnalyticsRowOptionsModal
          entity={editedRow.entity}
          tab={editedRow.tab}
          onClose={() => setEditedRow(undefined)}
          onApply={onApplyRowOptions}
        />
      )}
    </>
  );
};

export default AnalyticsConfigContent;
