'use client';
import { IconUpload } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { exportConfig, exportConfigMap } from '@/src/app/[lang]/export-config/actions';
import Button from '@/src/components/Common/Button/Button';
import RadioField from '@/src/components/Common/RadioField/RadioField';
import ConfigContent from '@/src/components/ExportConfig/Content/ConfigContent';
import {
  fulDependenciesConfig,
  getComponents,
  getComponentTypes,
} from '@/src/components/ExportConfig/ExportConfig.utils';
import PreviewModal from '@/src/components/ExportConfig/Preview/PreviewModal';
import ExportDependencies from '@/src/components/ExportConfig/Structure/Dependencies';
import { BasicI18nKey, ButtonsI18nKey, ExportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
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

const ExportConfig: FC = () => {
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

  const exportFormats: RadioButtonModel[] = [
    {
      id: ExportFormat.ADMIN,
      name: t(ExportI18nKey.AdminFormat),
    },
    {
      id: ExportFormat.CORE,
      name: t(ExportI18nKey.CoreFormat),
    },
  ];

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
      const type = t(BasicI18nKey.Config);
      exportConfig({
        ...exportRequest,
        addSecrets,
      })
        .then(({ blob, fileName }) => {
          showNotification(
            getSuccessNotification(
              t(ExportI18nKey.ExportSuccessTitle, { type }),
              t(ExportI18nKey.ExportSuccessDescription),
            ),
          );

          downloadFile(blob, fileName);
        })
        .catch(() => {
          showNotification(
            getErrorNotification(t(ExportI18nKey.ExportErrorTitle, { type }), t(ExportI18nKey.ExportErrorDescription)),
          );
        });
    },
    [exportRequest, showNotification, t],
  );

  const onExportMap = useCallback(() => {
    const type = t(BasicI18nKey.Config);
    exportConfigMap()
      .then(({ blob, fileName }) => {
        showNotification(
          getSuccessNotification(
            t(ExportI18nKey.ExportSuccessTitle, { type }),
            t(ExportI18nKey.ExportSuccessDescription),
          ),
        );

        downloadFile(blob, fileName);
      })
      .catch(() => {
        showNotification(
          getErrorNotification(t(ExportI18nKey.ExportErrorTitle, { type }), t(ExportI18nKey.ExportErrorDescription)),
        );
      });
  }, [showNotification, t]);

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
          <div className="flex flex-row gap-4 items-center">
            <Button
              cssClass="secondary"
              iconBefore={<IconUpload {...BASE_ICON_PROPS} />}
              title={t(ButtonsI18nKey.ExportConfigMap)}
              onClick={onExportMap}
            />
            <Button
              cssClass="primary"
              iconBefore={<IconUpload {...BASE_ICON_PROPS} />}
              title={t(ButtonsI18nKey.Export)}
              disable={isExportDisable}
              onClick={() => setPreviewModalState(PopUpState.Opened)}
            />
          </div>
        </div>
        <div className="flex-1 min-h-0 gap-x-3 flex flex-row w-full">
          <div className="border border-primary p-4 rounded w-[240px] flex flex-col">
            <h3 className="mb-4">{t(ExportI18nKey.Structure)}</h3>
            <div className="flex-1 min-w-0 flex flex-col gap-y-6">
              <RadioField
                radioButtons={exportFormats}
                activeRadioButton={selectedExportFormat}
                elementId="exportFormat"
                fieldTitle={t(ExportI18nKey.ExportFormat)}
                orientation={RadioFieldOrientation.Column}
                onChange={onChangeExportFormat}
              />

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
            </div>
          </div>
          <ConfigContent
            selectedExportFormat={selectedExportFormat}
            dependencies={dependencies}
            selectedExportType={selectedExportType}
            customExportData={customExportData}
            setCustomExportData={setCustomExportData}
          />
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
