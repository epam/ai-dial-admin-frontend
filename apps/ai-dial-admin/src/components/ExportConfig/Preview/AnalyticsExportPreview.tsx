import { DialLoader, DialTabs } from '@epam/ai-dial-ui-kit';
import { FC, useEffect, useMemo, useRef, useState } from 'react';

import { previewAnalyticsExportConfig } from '@/src/app/[lang]/export-config/actions';
import {
  getAnalyticsPreviewColDefs,
  getAnalyticsPreviewRows,
  getAnalyticsPreviewTabs,
} from '@/src/components/ExportConfig/analytics-utils';
import GridView from '@/src/components/Grid/GridView/GridView';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { CatalogExportRequest } from '@/src/models/analytics/catalog-export';
import { AnalyticsExportPreviewTab } from '@/src/types/analytics/export';
import { getErrorNotification } from '@/src/utils/notification';

interface Props {
  request: CatalogExportRequest;
  /** Told whether the service accepted the selection; the modal keeps its submit disabled until it has. */
  onPreviewResult: (isAccepted: boolean) => void;
}

const AnalyticsExportPreview: FC<Props> = ({ request, onPreviewResult }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);
  const onPreviewResultRef = useRef(onPreviewResult);
  const getReqRef = useRef(useProtectedRequest());

  const tabs = useMemo(() => getAnalyticsPreviewTabs(t), [t]);

  const [selectedTab, setSelectedTab] = useState<AnalyticsExportPreviewTab>(AnalyticsExportPreviewTab.OBJECTS);
  const [rows, setRows] = useState<Record<AnalyticsExportPreviewTab, object[]>>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // `useProtectedRequest` turns a rejected action into a failed envelope, so an unreachable service lands here too.
    const loadPreview = async () => {
      setIsLoading(true);
      const res = await getReqRef.current(previewAnalyticsExportConfig, request);
      setIsLoading(false);

      if (res.success && res.response) {
        setRows(getAnalyticsPreviewRows(res.response));
        onPreviewResultRef.current(true);
      } else {
        showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        onPreviewResultRef.current(false);
      }
    };

    void loadPreview();
  }, [request]);

  const columnDefs = useMemo(() => getAnalyticsPreviewColDefs(t, selectedTab), [t, selectedTab]);

  if (isLoading) {
    return <DialLoader size={50} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <DialTabs
          tabs={tabs}
          activeTab={selectedTab}
          onClick={(tab) => setSelectedTab(tab as AnalyticsExportPreviewTab)}
        />
      </div>
      <div className="flex-1 min-h-0">
        <GridView
          key={selectedTab}
          columnDefs={columnDefs}
          rowData={rows?.[selectedTab] ?? []}
          emptyDataProps={{ title: t(EntitiesI18nKey.NoEntities) }}
        />
      </div>
    </div>
  );
};

export default AnalyticsExportPreview;
