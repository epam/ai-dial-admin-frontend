'use client';
import { FC, useCallback, useEffect, useRef, useMemo, useState } from 'react';

import {
  NotificationVariant,
  DialNotification,
  DialNoDataContent,
  DialPrimaryButton,
  DialRadioGroup,
  RadioButtonWithContent,
  RadioGroupOrientation,
} from '@epam/ai-dial-ui-kit';
import { IconEyeOff, IconUpload } from '@tabler/icons-react';

import ConfigScopeSelector from '@/src/components/Common/ConfigScopeSelector/ConfigScopeSelector';

import {
  exportAnalyticsConfig,
  exportConfig,
  exportConfigMap,
  exportDeploymentConfig,
} from '@/src/app/[lang]/export-config/actions';
import { buildCatalogExportRequest } from '@/src/components/ExportConfig/analytics-utils';
import AnalyticsConfigContent from '@/src/components/ExportConfig/Content/AnalyticsConfigContent';
import ConfigContent from '@/src/components/ExportConfig/Content/ConfigContent';
import DeploymentConfigContent from '@/src/components/ExportConfig/Content/DeploymentConfigContent';
import PreviewModal from '@/src/components/ExportConfig/Preview/PreviewModal';
import ExportDependencies from '@/src/components/ExportConfig/Structure/Dependencies';
import {
  fulDependenciesConfig,
  getComponents,
  getComponentTypes,
  getExportScopes,
  hasSelection,
} from '@/src/components/ExportConfig/utils';
import {
  buildDeploymentExportPreviewRequest,
  getDeploymentExportComponents,
} from '@/src/components/ExportConfig/deployment-utils';
import { ButtonsI18nKey, ExportI18nKey, ImportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportDependenciesConfig, ExportRequest } from '@/src/models/export';
import { ExportComponentType, ExportFormat, ExportType } from '@/src/types/export';
import { downloadFile } from '@/src/utils/download';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import ExportTopics from './Structure/Topics';

interface Props {
  enableExportConfigMap?: boolean;
  deploymentsEnabled?: boolean;
  isAnalyticsEnabled?: boolean;
}

const ExportConfig: FC<Props> = ({ enableExportConfigMap, deploymentsEnabled, isAnalyticsEnabled }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const { showNotification } = useNotification();
  const [selectedComponentType, setSelectedComponentType] = useState<ExportComponentType>(ExportComponentType.ADMIN);
  const [selectedExportFormat, setSelectedExportFormat] = useState(ExportFormat.ADMIN);
  const [selectedExportType, setSelectedExportType] = useState(ExportType.Full);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dependencies, setDependencies] = useState<ExportDependenciesConfig>({ ...fulDependenciesConfig });
  const [customExportData, setCustomExportData] = useState<Record<string, EntitiesGridData[]>>({});
  const [isExportDisable, setIsExportDisable] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const isAdminContext = selectedComponentType === ExportComponentType.ADMIN;

  const scopes = useMemo(
    () => getExportScopes(!!deploymentsEnabled, !!isAnalyticsEnabled),
    [deploymentsEnabled, isAnalyticsEnabled],
  );

  const exportTypes: RadioButtonWithContent[] = [
    {
      id: ExportType.Full,
      name: t(ExportI18nKey.FullConfig),
    },
    {
      id: ExportType.Custom,
      name: t(ExportI18nKey.Custom),
    },
  ];

  const exportFormats: RadioButtonWithContent[] = useMemo(() => {
    const formats = [
      {
        id: ExportFormat.ADMIN,
        name: t(ImportI18nKey.DialArchive),
      },
      {
        id: ExportFormat.CORE,
        name: t(ImportI18nKey.DialCoreFile),
      },
    ];

    if (enableExportConfigMap && selectedExportType !== ExportType.Custom) {
      formats.push({
        id: ExportFormat.ACTIVE_CONFIG,
        name: t(ExportI18nKey.ActiveConfig),
      });
    }
    return formats;
  }, [enableExportConfigMap, t, selectedExportType]);

  const exportRequest = useMemo(() => {
    return {
      $type: selectedExportType,
      exportFormat: selectedExportFormat,
      componentTypes: getComponentTypes(dependencies, selectedExportFormat, selectedExportType),
      components: getComponents(selectedExportType, customExportData),
      topics: selectedTopics,
    } as ExportRequest;
  }, [selectedExportType, selectedExportFormat, dependencies, customExportData, selectedTopics]);

  const isAnalyticsContext = selectedComponentType === ExportComponentType.ANALYTICS;

  const analyticsExportRequest = useMemo(
    () => buildCatalogExportRequest(selectedExportType, customExportData),
    [selectedExportType, customExportData],
  );

  const prevComponentTypeRef = useRef(selectedComponentType);
  const onChangeComponentType = useCallback((key: string) => {
    const newType = key as ExportComponentType;
    if (newType === prevComponentTypeRef.current) return;
    prevComponentTypeRef.current = newType;

    setSelectedComponentType(newType);
    setCustomExportData({});

    if (newType === ExportComponentType.ANALYTICS) {
      setSelectedExportType(ExportType.Full);
    }

    if (newType === ExportComponentType.ADMIN) {
      setSelectedExportFormat(ExportFormat.ADMIN);
      setSelectedExportType(ExportType.Full);
      setDependencies({ ...fulDependenciesConfig });
      setSelectedTopics([]);
    }
  }, []);

  const onChangeExportType = useCallback((key: string) => {
    setSelectedExportType(key as ExportType);
  }, []);

  const onChangeExportFormat = useCallback((key: string) => {
    setSelectedExportFormat(key as ExportFormat);
    if (key === ExportFormat.ACTIVE_CONFIG) {
      setSelectedExportType(ExportType.Full);
    }
    setCustomExportData({});
  }, []);

  const onExport = useCallback(
    (addSecrets: boolean) => {
      const type = t(ExportI18nKey.Config);
      exportConfig({
        ...exportRequest,
        addSecrets,
      })
        .then(({ blob, fileName }) => {
          showNotification(
            getSuccessNotification(t(ExportI18nKey.SuccessTitle, { type }), t(ExportI18nKey.SuccessDescription)),
          );

          downloadFile(blob, fileName);
        })
        .catch(() => {
          showNotification(
            getErrorNotification(t(ExportI18nKey.ErrorTitle, { type }), t(ExportI18nKey.ErrorDescription)),
          );
        });
    },
    [exportRequest, showNotification, t],
  );

  const onDeploymentExport = useCallback(
    (addSecrets: boolean, addGlobalFirewall: boolean) => {
      const type = t(ExportI18nKey.Deployments);
      const components = getDeploymentExportComponents(customExportData);
      exportDeploymentConfig({
        $type: ExportType.Custom,
        addSecrets,
        addGlobalImageBuildDomainWhitelist: addGlobalFirewall,
        components,
      })
        .then(({ blob, fileName }) => {
          showNotification(
            getSuccessNotification(t(ExportI18nKey.SuccessTitle, { type }), t(ExportI18nKey.SuccessDescription)),
          );
          downloadFile(blob, fileName);
        })
        .catch(() => {
          showNotification(
            getErrorNotification(t(ExportI18nKey.ErrorTitle, { type }), t(ExportI18nKey.ErrorDescription)),
          );
        });
    },
    [customExportData, showNotification, t],
  );

  const onAnalyticsExport = useCallback(async () => {
    const type = t(MenuI18nKey.Analytics);
    const showExportError = (message?: string, requestId?: string) =>
      showNotification(
        getErrorNotification(
          t(ExportI18nKey.ErrorTitle, { type }),
          message || t(ExportI18nKey.ErrorDescription),
          requestId,
        ),
      );

    try {
      const res = await exportAnalyticsConfig(analyticsExportRequest);
      if (res.success && res.response) {
        showNotification(
          getSuccessNotification(t(ExportI18nKey.SuccessTitle, { type }), t(ExportI18nKey.SuccessDescription)),
        );
        downloadFile(res.response.blob, res.response.fileName);
      } else {
        showExportError(res.errorMessage, res.requestId);
      }
    } catch {
      showExportError();
    }
  }, [analyticsExportRequest, showNotification, t]);

  const onPrepare = useCallback(
    (addSecrets: boolean, addGlobalFirewall?: boolean) => {
      setIsModalOpen(false);
      switch (selectedComponentType) {
        case ExportComponentType.DEPLOYMENTS:
          onDeploymentExport(addSecrets, addGlobalFirewall ?? false);
          break;
        case ExportComponentType.ANALYTICS:
          void onAnalyticsExport();
          break;
        default:
          onExport(addSecrets);
      }
    },
    [selectedComponentType, onDeploymentExport, onAnalyticsExport, onExport],
  );

  const onExportMap = useCallback(() => {
    const type = t(ExportI18nKey.Config);
    exportConfigMap()
      .then(({ blob, fileName }) => {
        showNotification(
          getSuccessNotification(t(ExportI18nKey.SuccessTitle, { type }), t(ExportI18nKey.SuccessDescription)),
        );

        downloadFile(blob, fileName);
      })
      .catch(() => {
        showNotification(
          getErrorNotification(t(ExportI18nKey.ErrorTitle, { type }), t(ExportI18nKey.ErrorDescription)),
        );
      });
  }, [showNotification, t]);

  // An empty Custom selection would reach the service as `components: []`, which it reads as "export everything".
  const isEmptyAnalyticsCustom =
    isAnalyticsContext && selectedExportType === ExportType.Custom && analyticsExportRequest.components.length === 0;

  const onTryExport = useCallback(() => {
    if (isEmptyAnalyticsCustom) {
      return;
    }
    if (isAdminContext && selectedExportFormat === ExportFormat.ACTIVE_CONFIG) {
      onExportMap();
    } else {
      setIsModalOpen(true);
    }
  }, [isAdminContext, isEmptyAnalyticsCustom, onExportMap, selectedExportFormat]);

  useEffect(() => {
    if (isAnalyticsContext && selectedExportType === ExportType.Full) {
      setIsExportDisable(false);
    } else if (!isAdminContext) {
      setIsExportDisable(!hasSelection(customExportData));
    } else if (exportRequest.$type === ExportType.Full) {
      setIsExportDisable(exportRequest.componentTypes.length === 0);
    } else {
      setIsExportDisable(exportRequest.components.length === 0);
    }
  }, [exportRequest, isAdminContext, isAnalyticsContext, selectedExportType, customExportData]);

  const renderContent = () => {
    switch (selectedComponentType) {
      case ExportComponentType.DEPLOYMENTS:
        return (
          <DeploymentConfigContent customExportData={customExportData} setCustomExportData={setCustomExportData} />
        );
      case ExportComponentType.ANALYTICS:
        return (
          <AnalyticsConfigContent
            customExportData={customExportData}
            setCustomExportData={setCustomExportData}
            isFull={selectedExportType === ExportType.Full}
          />
        );
      default:
        if (selectedExportFormat === ExportFormat.ACTIVE_CONFIG) {
          return <DialNoDataContent title={t(ExportI18nKey.NoPreview)} icon={<IconEyeOff size={50} />} />;
        }
        return (
          <ConfigContent
            selectedExportFormat={selectedExportFormat}
            dependencies={dependencies}
            selectedExportType={selectedExportType}
            customExportData={customExportData}
            setCustomExportData={setCustomExportData}
            selectedTopics={selectedTopics}
          />
        );
    }
  };

  if (isReadOnlyAdmin) {
    return (
      <div className="flex flex-col size-full rounded p-4 bg-layer-2 gap-4">
        <h1>{t(MenuI18nKey.ExportConfig)}</h1>
        <DialNotification variant={NotificationVariant.Info} message={t(MenuI18nKey.ReadOnlyAdminExportUnavailable)} />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col size-full rounded p-4 bg-layer-2">
        <div className="mb-4 flex flex-row items-center justify-between">
          <h1>{t(MenuI18nKey.ExportConfig)}</h1>
          <DialPrimaryButton
            iconBefore={<IconUpload {...BASE_BUTTON_ICON_PROPS} />}
            label={t(ButtonsI18nKey.Export)}
            disabled={isExportDisable}
            onClick={onTryExport}
          />
        </div>
        <div className="flex-1 min-h-0 gap-x-3 flex flex-row w-full">
          <div className="border border-primary p-4 rounded w-[340px] flex flex-col">
            <h3 className="mb-4">{t(ExportI18nKey.Structure)}</h3>
            <div className="flex flex-1 flex-col gap-y-8 min-h-0 min-w-0 overflow-auto">
              {scopes.length > 1 && (
                <ConfigScopeSelector
                  scopes={scopes}
                  selectedScope={selectedComponentType}
                  onChange={onChangeComponentType}
                />
              )}
              {isAnalyticsContext && (
                <DialRadioGroup
                  radioButtons={exportTypes}
                  activeRadioButton={selectedExportType}
                  elementId="analyticsExportType"
                  fieldTitle={t(ExportI18nKey.ExportType)}
                  orientation={RadioGroupOrientation.Column}
                  onChange={onChangeExportType}
                />
              )}
              {isAdminContext && (
                <>
                  <DialRadioGroup
                    radioButtons={exportFormats}
                    activeRadioButton={selectedExportFormat}
                    elementId="exportFormat"
                    fieldTitle={t(ExportI18nKey.ExportFormat)}
                    orientation={RadioGroupOrientation.Column}
                    onChange={onChangeExportFormat}
                  />
                  {selectedExportFormat !== ExportFormat.ACTIVE_CONFIG && (
                    <>
                      <DialRadioGroup
                        radioButtons={exportTypes}
                        activeRadioButton={selectedExportType}
                        elementId="exportType"
                        fieldTitle={t(ExportI18nKey.ExportType)}
                        orientation={RadioGroupOrientation.Column}
                        onChange={onChangeExportType}
                      />

                      {selectedExportType === ExportType.Full && (
                        <ExportDependencies
                          selectedExportFormat={selectedExportFormat}
                          dependencies={dependencies}
                          onChangeConfig={(deps) => setDependencies(deps)}
                        />
                      )}
                      <ExportTopics selectedTopics={selectedTopics} setSelectedTopics={setSelectedTopics} />
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          {renderContent()}
        </div>
      </div>

      {isModalOpen && (
        <PreviewModal
          exportRequest={isAdminContext ? exportRequest : undefined}
          deploymentExportRequest={
            selectedComponentType === ExportComponentType.DEPLOYMENTS
              ? buildDeploymentExportPreviewRequest(customExportData)
              : undefined
          }
          analyticsExportRequest={
            selectedComponentType === ExportComponentType.ANALYTICS ? analyticsExportRequest : undefined
          }
          scope={selectedComponentType}
          isModalOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onPrepare={onPrepare}
        />
      )}
    </>
  );
};

export default ExportConfig;
