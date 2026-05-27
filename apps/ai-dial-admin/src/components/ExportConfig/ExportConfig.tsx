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

import { exportConfig, exportConfigMap, exportDeploymentConfig } from '@/src/app/[lang]/export-config/actions';
import ConfigContent from '@/src/components/ExportConfig/Content/ConfigContent';
import DeploymentConfigContent from '@/src/components/ExportConfig/Content/DeploymentConfigContent';
import PreviewModal from '@/src/components/ExportConfig/Preview/PreviewModal';
import ExportDependencies from '@/src/components/ExportConfig/Structure/Dependencies';
import { fulDependenciesConfig, getComponents, getComponentTypes } from '@/src/components/ExportConfig/utils';
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
}

const ExportConfig: FC<Props> = ({ enableExportConfigMap, deploymentsEnabled }) => {
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

  const isDeploymentContext = useMemo(
    () => selectedComponentType === ExportComponentType.DEPLOYMENTS,
    [selectedComponentType],
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

  const prevComponentTypeRef = useRef(selectedComponentType);
  const onChangeComponentType = useCallback((key: string) => {
    const newType = key as ExportComponentType;
    if (newType === prevComponentTypeRef.current) return;
    prevComponentTypeRef.current = newType;

    setSelectedComponentType(newType);
    setCustomExportData({});

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

  const onTryExport = useCallback(() => {
    if (!isDeploymentContext && selectedExportFormat === ExportFormat.ACTIVE_CONFIG) {
      onExportMap();
    } else {
      setIsModalOpen(true);
    }
  }, [isDeploymentContext, onExportMap, selectedExportFormat]);

  useEffect(() => {
    if (isDeploymentContext) {
      const hasComponents = Object.values(customExportData).some((data) => data.length > 0);
      setIsExportDisable(!hasComponents);
    } else if (exportRequest.$type === ExportType.Full) {
      setIsExportDisable(exportRequest.componentTypes.length === 0);
    } else {
      setIsExportDisable(exportRequest.components.length === 0);
    }
  }, [exportRequest, isDeploymentContext, customExportData]);

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
              {deploymentsEnabled && (
                <ConfigScopeSelector selectedScope={selectedComponentType} onChange={onChangeComponentType} />
              )}
              {!isDeploymentContext && (
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
          {isDeploymentContext ? (
            <DeploymentConfigContent customExportData={customExportData} setCustomExportData={setCustomExportData} />
          ) : selectedExportFormat === ExportFormat.ACTIVE_CONFIG ? (
            <DialNoDataContent title={t(ExportI18nKey.NoPreview)} icon={<IconEyeOff size={50} />} />
          ) : (
            <ConfigContent
              selectedExportFormat={selectedExportFormat}
              dependencies={dependencies}
              selectedExportType={selectedExportType}
              customExportData={customExportData}
              setCustomExportData={setCustomExportData}
              selectedTopics={selectedTopics}
            />
          )}
        </div>
      </div>

      {isModalOpen && (
        <PreviewModal
          exportRequest={isDeploymentContext ? undefined : exportRequest}
          deploymentExportRequest={
            isDeploymentContext ? buildDeploymentExportPreviewRequest(customExportData) : undefined
          }
          isDeploymentExport={isDeploymentContext}
          isModalOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onPrepare={(addSecrets, addGlobalFirewall) => {
            setIsModalOpen(false);
            if (isDeploymentContext) {
              onDeploymentExport(addSecrets, addGlobalFirewall ?? false);
            } else {
              onExport(addSecrets);
            }
          }}
        />
      )}
    </>
  );
};

export default ExportConfig;
