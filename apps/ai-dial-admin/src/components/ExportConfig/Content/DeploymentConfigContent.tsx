'use client';
import { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react';

import { getDeploymentEntities } from '@/src/app/[lang]/export-config/actions';
import TabbedSelectionContent from '@/src/components/ExportConfig/Content/TabbedSelectionContent';
import {
  getDeploymentButtonTitle,
  getDeploymentColDefs,
  getDeploymentTabs,
} from '@/src/components/ExportConfig/deployment-utils';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';

interface Props {
  customExportData: Record<string, EntitiesGridData[]>;
  setCustomExportData: Dispatch<SetStateAction<Record<string, EntitiesGridData[]>>>;
}

const DeploymentConfigContent: FC<Props> = ({ customExportData, setCustomExportData }) => {
  const t = useI18n();

  const tabs = useMemo(() => getDeploymentTabs(t), [t]);

  // The deployment reads report no failure, so every answer is a success — an empty one when the read failed.
  const loadCandidates = useCallback(
    async (tab: string) => ({ success: true, response: await getDeploymentEntities(tab) }),
    [],
  );
  const getColDefs = useCallback(
    (tab: string, remove?: (entity?: EntitiesGridData) => void) => getDeploymentColDefs(t, remove, tab),
    [t],
  );
  const getAddButtonTitle = useCallback((tab: string) => getDeploymentButtonTitle(t, tab), [t]);
  const getEmptyTitle = useCallback((tabTitle: string) => `No ${tabTitle.toLowerCase() || 'entities'} selected`, []);

  return (
    <TabbedSelectionContent
      tabs={tabs}
      customExportData={customExportData}
      setCustomExportData={setCustomExportData}
      loadCandidates={loadCandidates}
      getColDefs={getColDefs}
      getAddButtonTitle={getAddButtonTitle}
      getEmptyTitle={getEmptyTitle}
    />
  );
};

export default DeploymentConfigContent;
