import { DialCheckbox, DialFormPopup, DialLoader, DialTabs, PopupSize, TabModel } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { previewDeploymentExportConfig, previewExportConfig } from '@/src/app/[lang]/export-config/actions';
import ConfigContentGrid from '@/src/components/ExportConfig/Content/ConfigContentGrid';
import { getDeploymentColDefs } from '@/src/components/ExportConfig/deployment-utils';
import { getDeploymentExportPreviewTabs, getPreviewTabs } from '@/src/components/ExportConfig/Preview/utils';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ButtonsI18nKey, EntitiesI18nKey, ExportI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { DeploymentExportRequest, ExportRequest } from '@/src/models/export';
import { EntityType } from '@/src/types/entity-type';
import { DeploymentExportPreviewResponse } from '@/src/models/deployments/preview';
import { ExportType } from '@/src/types/export';
import { getErrorNotification } from '@/src/utils/notification';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';

interface Props {
  exportRequest?: Partial<ExportRequest>;
  deploymentExportRequest?: DeploymentExportRequest;
  isDeploymentExport?: boolean;
  isModalOpen: boolean;
  onClose: () => void;
  onPrepare: (isIncludeSecret: boolean, addGlobalFirewall?: boolean) => void;
}

const PreviewModal: FC<Props> = ({
  exportRequest,
  deploymentExportRequest,
  isDeploymentExport,
  onPrepare,
  isModalOpen,
  onClose,
}) => {
  const t = useI18n();

  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);
  const getReqRef = useRef(useProtectedRequest());
  const [isIncludeSecret, setIsIncludeSecret] = useState<boolean>(false);
  const [isIncludeGlobalFirewall, setIsIncludeGlobalFirewall] = useState<boolean>(false);
  const [tabs, setTabs] = useState<TabModel[]>([]);
  const [data, setData] = useState<Record<string, EntitiesGridData[]>>({});
  const [selectedTab, setSelectedTab] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);

  const toggleIncludeSecret = useCallback(() => {
    setIsIncludeSecret((prev) => !prev);
  }, []);

  const toggleIncludeGlobalFirewall = useCallback(() => {
    setIsIncludeGlobalFirewall((prev) => !prev);
  }, []);

  // Admin export preview
  useEffect(() => {
    if (isDeploymentExport || !exportRequest) {
      return;
    }

    if (exportRequest.$type === ExportType.Custom && exportRequest.components?.length === 0) {
      return;
    }

    setIsLoadingData(true);
    getReqRef
      .current(previewExportConfig, {
        ...exportRequest,
        addSecrets: isIncludeSecret,
      } as ExportRequest)
      .then((res) => {
        setIsLoadingData(false);
        if (res.success) {
          const data = res.response as Record<string, EntitiesGridData[]>;
          const { convertedData, tabs } = getPreviewTabs(data, isIncludeSecret, exportRequest.exportFormat, t);

          setData(convertedData);
          setTabs(tabs);
          setSelectedTab(tabs[0]?.id);
        } else {
          showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
  }, [exportRequest, isDeploymentExport, isIncludeSecret, showNotification, t]);

  // Deployment export preview
  useEffect(() => {
    if (!isDeploymentExport || !deploymentExportRequest) {
      return;
    }

    if (deploymentExportRequest.$type === ExportType.Custom && deploymentExportRequest.components?.length === 0) {
      return;
    }

    setIsLoadingData(true);
    getReqRef.current(previewDeploymentExportConfig, deploymentExportRequest).then((res) => {
      setIsLoadingData(false);
      if (res.success) {
        const response = res.response as DeploymentExportPreviewResponse;
        const { convertedData, tabs } = getDeploymentExportPreviewTabs(response, t);

        setData(convertedData);
        setTabs(tabs);
        setSelectedTab(tabs[0]?.id);
      } else {
        showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [deploymentExportRequest, isDeploymentExport, showNotification, t]);

  const submitLabel = isDeploymentExport ? t(ButtonsI18nKey.PrepareFile) : t(ButtonsI18nKey.Export);

  return (
    <DialFormPopup
      onClose={onClose}
      header={t(ExportI18nKey.FilePreview)}
      portalId="ExportFilePreview"
      open={isModalOpen}
      className="h-[754px]"
      size={PopupSize.Lg}
      submitLabel={submitLabel}
      onSubmit={() => onPrepare(isIncludeSecret, isDeploymentExport ? isIncludeGlobalFirewall : undefined)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onCancel={onClose}
    >
      <div className="flex flex-col gap-4 p-6 h-full">
        <div className="flex-1 min-h-0">
          {isLoadingData ? (
            <DialLoader size={50} />
          ) : isDeploymentExport ? (
            <div className="flex flex-col h-full">
              <div className="mb-3">
                <DialTabs tabs={tabs} activeTab={selectedTab} onClick={(tab) => setSelectedTab(tab)} />
              </div>
              <div className="flex-1 min-h-0">
                <GridView
                  columnDefs={getDeploymentColDefs(t, undefined, selectedTab)}
                  rowData={data[selectedTab] || []}
                  emptyDataProps={{ title: t(EntitiesI18nKey.NoEntities) }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="mb-3">
                <DialTabs tabs={tabs} activeTab={selectedTab} onClick={(tab) => setSelectedTab(tab)} />
              </div>
              <div className="flex-1 min-h-0">
                <ConfigContentGrid selectedTab={selectedTab as EntityType} tabData={data} isFull={true} />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-row items-center gap-4">
          <DialCheckbox
            checked={isIncludeSecret}
            label={t(ExportI18nKey.IncludeSecrets)}
            id="includeSecret"
            onChange={toggleIncludeSecret}
          />
          {isDeploymentExport && (
            <>
              <div className="h-5 w-px bg-layer-4" />
              <DialCheckbox
                checked={isIncludeGlobalFirewall}
                label={t(ExportI18nKey.IncludeGlobalFirewall)}
                id="includeGlobalFirewall"
                onChange={toggleIncludeGlobalFirewall}
              />
            </>
          )}
        </div>
      </div>
    </DialFormPopup>
  );
};

export default PreviewModal;
