'use client';
import { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react';

import { getAnalyticsEntities } from '@/src/app/[lang]/export-config/actions';
import { getButtonTitle } from '@/src/components/ExportConfig/AddEntities/utils';
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
}

const AnalyticsConfigContent: FC<Props> = ({ customExportData, setCustomExportData, isFull }) => {
  const t = useI18n();

  const tabs = useMemo(() => getAnalyticsTabs(t), [t]);

  const getColDefs = useCallback(
    (_tab: string, remove?: (entity?: EntitiesGridData) => void) => getAnalyticsColDefs(remove),
    [],
  );
  const getAddButtonTitle = useCallback(
    (tab: string) => getButtonTitle(t, tab as AnalyticsExportEntityType, true),
    [t],
  );
  const getEmptyTitle = useCallback(() => t(EntitiesI18nKey.NoEntities), [t]);

  return (
    <TabbedSelectionContent
      tabs={tabs}
      customExportData={customExportData}
      setCustomExportData={setCustomExportData}
      loadCandidates={getAnalyticsEntities}
      getColDefs={getColDefs}
      getAddButtonTitle={getAddButtonTitle}
      getEmptyTitle={getEmptyTitle}
      isFull={isFull}
    />
  );
};

export default AnalyticsConfigContent;
