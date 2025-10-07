'use client';
import { IconUpload } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';

import { exportConfig, exportConfigMap } from '@/src/app/[lang]/export-config/actions';
import RadioField from '@/src/components/Common/RadioField/RadioField';
import ConfigContent from '@/src/components/ExportConfig/Content/ConfigContent';
import { fulDependenciesConfig, getComponents, getComponentTypes } from '@/src/components/ExportConfig/utils';
import PreviewModal from '@/src/components/ExportConfig/Preview/PreviewModal';
import ExportDependencies from '@/src/components/ExportConfig/Structure/Dependencies';
import { ButtonsI18nKey, ExportI18nKey, ImportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportDependenciesConfig, ExportRequest } from '@/src/models/export';
import { RadioButtonModel } from '@/src/models/radio-button';
import { ExportFormat, ExportType } from '@/src/types/export';
import { PopUpState } from '@/src/types/pop-up';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import { downloadFile } from '@/src/utils/download';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import NoPreview from '@/src/components/ExportConfig/Preview/NoPreview';

interface Props {
  enableExportConfigMap?: boolean;
}

const ExportConfig: FC<Props> = ({ enableExportConfigMap }) => {
  const t = useI18n();

  const { showNotification } = useNotification();
  const [selectedExportFormat, setSelectedExportFormat] = useState(ExportFormat.ADMIN);
  const [selectedExportType, setSelectedExportType] = useState(ExportType.Full);
  const [previewModalState, setPreviewModalState] = useState(PopUpState.Closed);
  const [dependencies, setDependencies] = useState<ExportDependenciesConfig>({ ...fulDependenciesConfig });
  const [customExportData, setCustomExportData] = useState<Record<string, EntitiesGridData[]>>({});
  const [isExportDisable, setIsExportDisable] = useState(false);

  const exportTypes: RadioButtonModel[] = [
    {
      id: ExportType.Full,
      name: t(ExportI18nKey.FullConfig),
    },
    {
      id: ExportType.Custom,
      name: t(ExportI18nKey.Custom),
    },
  ];

  const exportFormats: RadioButtonModel[] = useMemo(() => {
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

    if (enableExportConfigMap) {
      formats.push({
        id: ExportFormat.ACTIVE_CONFIG,
        name: t(ExportI18nKey.ActiveConfig),
      });
    }
    return formats;
  }, [enableExportConfigMap, t]);

  const exportRequest = useMemo(() => {
    return {
      $type: selectedExportType,
      exportFormat: selectedExportFormat,
      componentTypes: getComponentTypes(dependencies, selectedExportFormat, selectedExportType),
      components: getComponents(selectedExportType, customExportData),
    } as ExportRequest;
  }, [selectedExportType, customExportData, selectedExportFormat, dependencies]);

  const onChangeExportType = useCallback((key: string) => {
    setSelectedExportType(key as ExportType);
  }, []);

  const onChangeExportFormat = useCallback((key: string) => {
    setSelectedExportFormat(key as ExportFormat);
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
    if (selectedExportFormat === ExportFormat.ACTIVE_CONFIG) {
      onExportMap();
    } else {
      setPreviewModalState(PopUpState.Opened);
    }
  }, [onExportMap, selectedExportFormat]);

  useEffect(() => {
    if (exportRequest.$type === ExportType.Full) {
      setIsExportDisable(exportRequest.componentTypes.length === 0);
    } else {
      setIsExportDisable(exportRequest.components.length === 0);
    }
  }, [exportRequest]);

  return (
    <>
      <div className="flex flex-col w-full h-full rounded p-4 bg-layer-2">
        <div className="mb-4 flex flex-row items-center justify-between">
          <h1>{t(MenuI18nKey.ExportConfig)}</h1>
          <DialButton
            variant={ButtonVariant.Primary}
            iconBefore={<IconUpload {...BASE_ICON_PROPS} />}
            title={t(ButtonsI18nKey.Export)}
            disable={isExportDisable}
            onClick={onTryExport}
          />
        </div>
        <div className="flex-1 min-h-0 gap-x-3 flex flex-row w-full">
          <div className="border border-primary p-4 rounded w-[240px] flex flex-col">
            <h3 className="mb-4">{t(ExportI18nKey.Structure)}</h3>
            <div className="flex flex-1 flex-col gap-y-6 min-h-0 min-w-0 overflow-auto">
              <RadioField
                radioButtons={exportFormats}
                activeRadioButton={selectedExportFormat}
                elementId="exportFormat"
                fieldTitle={t(ExportI18nKey.ExportFormat)}
                orientation={RadioFieldOrientation.Column}
                onChange={onChangeExportFormat}
              />
              {selectedExportFormat !== ExportFormat.ACTIVE_CONFIG && (
                <>
                  <RadioField
                    radioButtons={exportTypes}
                    activeRadioButton={selectedExportType}
                    elementId="exportType"
                    fieldTitle={t(ExportI18nKey.ExportType)}
                    orientation={RadioFieldOrientation.Column}
                    onChange={onChangeExportType}
                  />

                  {selectedExportType === ExportType.Full && (
                    <div className="flex-1 min-h-0">
                      <ExportDependencies
                        selectedExportFormat={selectedExportFormat}
                        dependencies={dependencies}
                        onChangeConfig={(deps) => setDependencies(deps)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {selectedExportFormat === ExportFormat.ACTIVE_CONFIG ? (
            <NoPreview />
          ) : (
            <ConfigContent
              selectedExportFormat={selectedExportFormat}
              dependencies={dependencies}
              selectedExportType={selectedExportType}
              customExportData={customExportData}
              setCustomExportData={setCustomExportData}
            />
          )}
        </div>
      </div>

      {previewModalState === PopUpState.Opened && (
        <PreviewModal
          exportRequest={exportRequest}
          modalState={previewModalState}
          onClose={() => setPreviewModalState(PopUpState.Closed)}
          onPrepare={(addSecrets) => {
            setPreviewModalState(PopUpState.Closed);
            onExport(addSecrets);
          }}
        />
      )}
    </>
  );
};

export default ExportConfig;
