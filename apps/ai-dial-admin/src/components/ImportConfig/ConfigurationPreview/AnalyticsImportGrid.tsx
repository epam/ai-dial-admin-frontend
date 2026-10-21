'use client';
import { DialTabs } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import ActivityDetails from '@/src/components/ActivityAudit/Modals/Details';
import GridView from '@/src/components/Grid/GridView/GridView';
import {
  ANALYTICS_IMPORT_GRID_OPTIONS,
  ANALYTICS_IMPORT_TAB_RESOURCE,
  getAnalyticsImportColDefs,
  getAnalyticsImportTabs,
} from '@/src/components/ImportConfig/ConfigurationPreview/analytics-import.utils';
import { AnalyticsImportRow } from '@/src/components/ImportConfig/ConfigurationPreview/models';
import { EntitiesI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialActivity } from '@/src/models/activity-audit';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { AnalyticsImportPreviewTab } from '@/src/types/analytics/import';

interface Props {
  rows: Record<AnalyticsImportPreviewTab, AnalyticsImportRow[]>;
  hasResult: boolean;
}

const AnalyticsImportGrid: FC<Props> = ({ rows, hasResult }) => {
  const t = useI18n();

  const [selectedTab, setSelectedTab] = useState(AnalyticsImportPreviewTab.TABLES);
  const [comparedRow, setComparedRow] = useState<AnalyticsImportRow>();

  const tabs = useMemo(() => getAnalyticsImportTabs(rows, t), [rows, t]);

  const onCompare = useCallback((row?: AnalyticsImportRow) => setComparedRow(row), []);
  const onCloseCompare = useCallback(() => setComparedRow(undefined), []);

  const columnDefs = useMemo(
    () => getAnalyticsImportColDefs(selectedTab, t, onCompare, hasResult),
    [selectedTab, t, onCompare, hasResult],
  );

  const comparedActivity = useMemo(
    () =>
      ({
        resourceId: comparedRow?.name,
        resourceType: ANALYTICS_IMPORT_TAB_RESOURCE[selectedTab],
        action: comparedRow?.action,
      }) as DialActivity,
    [comparedRow, selectedTab],
  );

  return (
    <>
      <div className="mb-3">
        <DialTabs
          tabs={tabs}
          activeTab={selectedTab}
          onClick={(tab) => setSelectedTab(tab as AnalyticsImportPreviewTab)}
        />
      </div>
      <div className="flex-1 min-h-0">
        <GridView
          key={selectedTab}
          columnDefs={columnDefs}
          rowData={rows[selectedTab]}
          additionalGridOptions={ANALYTICS_IMPORT_GRID_OPTIONS}
          emptyDataProps={{ title: t(EntitiesI18nKey.NoEntities) }}
        />
      </div>
      {comparedRow &&
        createPortal(
          <ActivityDetails
            partialActivity={comparedActivity}
            heading={t(ImportI18nKey.Changes)}
            currentState={comparedRow.entry.next as ActivityAuditEntity}
            rollBackState={comparedRow.entry.prev as ActivityAuditEntity}
            isModalOpen
            onClose={onCloseCompare}
          />,
          document.body,
        )}
    </>
  );
};

export default AnalyticsImportGrid;
