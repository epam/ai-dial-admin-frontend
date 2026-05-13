'use client';

import { FC, useEffect, useRef, useState } from 'react';

import { DialPrimaryButton, DialLoader, DialTabs, DialTooltip, TabModel } from '@epam/ai-dial-ui-kit';
import { IconDownload } from '@tabler/icons-react';

import {
  previewDeploymentImportConfig,
  previewJsonConfigs,
  previewZipConfig,
} from '@/src/app/[lang]/import-config/actions';
import ConfigurationGrid from '@/src/components/ImportConfig/ConfigurationPreview/ConfigurationGrid';
import {
  getConfigurationPreview,
  getDeploymentConfigurationPreview,
} from '@/src/components/ImportConfig/ConfigurationPreview/ConfigurationPreview.utils';
import DeploymentConfigurationGrid from '@/src/components/ImportConfig/ConfigurationPreview/DeploymentConfigurationGrid';
import ValidationBanner from '@/src/components/ImportConfig/ConfigurationPreview/ValidationBanner';
import { ValidationSummary } from '@/src/models/deployments/import';
import { ButtonsI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { FileComponentItem, FileConfiguration } from '@/src/models/import';
import { ActivityAuditEntity } from '@/src/types/activity-audit';
import { DeploymentImportPreviewResponse } from '@/src/models/deployments/preview';
import { EntityType } from '@/src/types/entity-type';
import { ImportFileType } from '@/src/types/import';
import { getErrorNotification } from '@/src/utils/notification';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';

interface Props {
  isImporting?: boolean;
  importBody: FormData;
  files: File[];
  fileType: ImportFileType;
  isDeployments?: boolean;
  onImportFile: () => void;
  onValidationChange?: (hasErrors: boolean) => void;
}

const EMPTY_VALIDATION_SUMMARY: ValidationSummary = { totalFailed: 0, errorsByTab: {} };

const ConfigurationPreview: FC<Props> = ({
  isImporting,
  files,
  importBody,
  fileType,
  isDeployments,
  onImportFile,
  onValidationChange,
}) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const showNotificationRef = useRef(showNotification);
  const onValidationChangeRef = useRef(onValidationChange);
  const getReqRef = useRef(useProtectedRequest());

  const [tabs, setTabs] = useState<TabModel[]>([]);
  const [selectedTab, setSelectedTab] = useState('');
  const [data, setData] = useState<Record<string, BaseEntity[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [currentState, setCurrentState] = useState<Record<string, ActivityAuditEntity[]>>({});
  const [prevState, setPrevState] = useState<Record<string, ActivityAuditEntity[]>>({});

  const [globalFirewall, setGlobalFirewall] = useState<FileComponentItem | null>(null);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary>(EMPTY_VALIDATION_SUMMARY);

  // Admin import preview
  useEffect(() => {
    if (isDeployments) return;
    setIsLoading(true);
    (fileType == ImportFileType.ARCHIVE
      ? getReqRef.current(previewZipConfig, importBody)
      : getReqRef.current(previewJsonConfigs, importBody)
    ).then((res) => {
      setIsLoading(false);
      if (res.success) {
        const fileConfiguration = res.response as FileConfiguration;
        const { previewData, prevData, tabs } = getConfigurationPreview(fileConfiguration, t);

        setCurrentState(previewData as Record<string, ActivityAuditEntity[]>);
        setPrevState(prevData as Record<string, ActivityAuditEntity[]>);
        setData(previewData);
        setTabs(tabs);
        setSelectedTab(tabs[0]?.id);
      } else {
        showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [fileType, importBody, isDeployments, t]);

  // Deployment import preview
  useEffect(() => {
    if (!isDeployments) return;
    setIsLoading(true);

    const resolutionPolicy = importBody.get('resolutionPolicy') as string;
    const fileBody = new FormData();
    const file = importBody.get('file') as File;
    if (file) fileBody.append('file', file);

    previewDeploymentImportConfig(fileBody, resolutionPolicy).then((res) => {
      setIsLoading(false);
      if (res.success) {
        const response = res.response as DeploymentImportPreviewResponse;
        const {
          previewData,
          prevData,
          tabs,
          globalFirewall: previewFirewall,
          validationSummary: nextValidationSummary,
        } = getDeploymentConfigurationPreview(response, t);

        setCurrentState(previewData as Record<string, ActivityAuditEntity[]>);
        setPrevState(prevData as Record<string, ActivityAuditEntity[]>);
        setData(previewData);
        setTabs(tabs);
        setSelectedTab(tabs[0]?.id);
        setGlobalFirewall(previewFirewall);
        setValidationSummary(nextValidationSummary);
        onValidationChangeRef.current?.(nextValidationSummary.totalFailed > 0);
      } else {
        showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        onValidationChangeRef.current?.(true);
      }
    });
  }, [importBody, isDeployments, t]);

  const hasValidationErrors = !!isDeployments && validationSummary.totalFailed > 0;
  const baseImportDisabled = isDeployments ? !files?.length : isLoading || !files;
  const isImportDisabled = baseImportDisabled || hasValidationErrors;
  const isErrorOnlyDisable = !baseImportDisabled && hasValidationErrors;

  return (
    <div className="flex flex-col flex-1 min-h-0 rounded border border-primary py-4 px-6 mt-8">
      <div className="mb-2 flex flex-row justify-between">
        <h1>{t(ImportI18nKey.Configuration)}</h1>
        <DialTooltip tooltip={t(ImportI18nKey.ImportBlockedTooltip)} hideTooltip={!isErrorOnlyDisable}>
          <DialPrimaryButton
            label={t(ButtonsI18nKey.Import)}
            disabled={isImportDisabled || isImporting}
            iconBefore={<IconDownload {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onImportFile}
          />
        </DialTooltip>
      </div>
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex flex-col size-full justify-center items-center">
            <DialLoader size={45} className="h-auto" />
            <p className="mt-3 text-primary small">{t(ImportI18nKey.ConfigurationParsing)}</p>
          </div>
        ) : (
          <div className="flex flex-col h-full relative">
            {isImporting && (
              <div className="size-full absolute bg-blackout z-10">
                <DialLoader size={45} />
              </div>
            )}
            {hasValidationErrors && (
              <div className="mb-3">
                <ValidationBanner count={validationSummary.totalFailed} />
              </div>
            )}
            <div className="mb-3">
              <DialTabs tabs={tabs} activeTab={selectedTab} onClick={(tab) => setSelectedTab(tab)} />
            </div>
            {isDeployments ? (
              <DeploymentConfigurationGrid
                selectedTab={selectedTab}
                tabData={data}
                currentState={currentState}
                prevState={prevState}
                globalFirewall={globalFirewall}
              />
            ) : (
              <ConfigurationGrid
                selectedTab={selectedTab as EntityType}
                tabData={data}
                currentState={currentState}
                prevState={prevState}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigurationPreview;
