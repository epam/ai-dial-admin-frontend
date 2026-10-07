'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { IconArrowNarrowRight } from '@tabler/icons-react';
import {
  DialPrimaryButton,
  RadioButtonWithContent,
  DialRadioGroup,
  RadioGroupOrientation,
  DialLoadFileAreaField,
  DialFileIcon,
} from '@epam/ai-dial-ui-kit';

import ConfigScopeSelector from '@/src/components/Common/ConfigScopeSelector/ConfigScopeSelector';
import { getConfigScopes } from '@/src/components/Common/ConfigScopeSelector/utils';
import { isLargeFile } from '@/src/components/EntityListView/Import/utils';
import { BasicI18nKey, ButtonsI18nKey, ImportI18nKey } from '@/src/constants/i18n';
import {
  ANALYTICS_IMPORT_RESOLUTIONS,
  ARCHIVE_IMPORT_TYPE,
  DEPLOYMENT_IMPORT_RESOLUTIONS,
  DIAL_JSON_IMPORT_TYPE,
  IMPORT_RESOLUTIONS,
} from '@/src/constants/import';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { CatalogResolutionPolicy } from '@/src/types/analytics/import';
import { DeploymentImportResolutionPolicy } from '@/src/types/deployments/import';
import { ExportComponentType } from '@/src/types/export';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';

const IMPORT_FILE_TYPES = (t: (str: string) => string): RadioButtonWithContent[] => [
  ARCHIVE_IMPORT_TYPE(t),
  DIAL_JSON_IMPORT_TYPE(t),
];

interface Props {
  files: File[];
  fileType: ImportFileType;
  isFilesValid?: boolean;
  configScope: ExportComponentType;
  deploymentsEnabled?: boolean;
  isAnalyticsEnabled?: boolean;
  analyticsPolicy: CatalogResolutionPolicy;
  onChangeAnalyticsPolicy: (policy: CatalogResolutionPolicy) => void;
  onChangeFiles: (files: File[]) => void;
  onChangeFileType: (fileType: string) => void;
  onChangeImportBody: (body: FormData) => void;
  onChangeConfigScope: (scope: string) => void;
  onNextStep: () => void;
}
const Files: FC<Props> = ({
  files,
  fileType,
  isFilesValid,
  configScope,
  deploymentsEnabled,
  isAnalyticsEnabled,
  analyticsPolicy,
  onChangeAnalyticsPolicy,
  onChangeFiles,
  onNextStep,
  onChangeImportBody,
  onChangeFileType,
  onChangeConfigScope,
}) => {
  const t = useI18n();

  const isDeployments = configScope === ExportComponentType.DEPLOYMENTS;
  const isAnalytics = configScope === ExportComponentType.ANALYTICS;

  const scopes = useMemo(
    () => getConfigScopes(!!deploymentsEnabled, !!isAnalyticsEnabled),
    [deploymentsEnabled, isAnalyticsEnabled],
  );

  const [activeResolution, setActiveResolution] = useState(ConflictResolutionPolicy.OVERRIDE);
  const [deploymentResolution, setDeploymentResolution] = useState(DeploymentImportResolutionPolicy.OVERWRITE);

  useEffect(() => {
    const body = new FormData();

    files.forEach((file) => {
      body.append('file', file);
    });
    if (isDeployments) {
      body.append('resolutionPolicy', deploymentResolution);
    } else if (!isAnalytics) {
      // Not for Analytics: its policy travels as its own value, outside the form body.
      body.append('resolutionPolicy', activeResolution.toUpperCase());
    }
    onChangeImportBody(body);
  }, [files, activeResolution, deploymentResolution, isDeployments, isAnalytics, onChangeImportBody]);

  const onChangeResolution = useCallback(
    (value: string) => {
      setActiveResolution(value as ConflictResolutionPolicy);
    },
    [setActiveResolution],
  );

  const onChangeDeploymentResolution = useCallback(
    (value: string) => {
      setDeploymentResolution(value as DeploymentImportResolutionPolicy);
    },
    [setDeploymentResolution],
  );

  const onChangeFile = useCallback(
    (files: File[]) => {
      onChangeFiles(files);
    },
    [onChangeFiles],
  );

  const renderOptions = () => {
    switch (configScope) {
      case ExportComponentType.DEPLOYMENTS:
        return (
          <DialRadioGroup
            radioButtons={DEPLOYMENT_IMPORT_RESOLUTIONS(t)}
            activeRadioButton={deploymentResolution}
            elementId="deploymentConflictResolution"
            fieldTitle={t(ImportI18nKey.ConflictResolution)}
            orientation={RadioGroupOrientation.Column}
            onChange={onChangeDeploymentResolution}
          />
        );
      case ExportComponentType.ANALYTICS:
        return (
          <DialRadioGroup
            radioButtons={ANALYTICS_IMPORT_RESOLUTIONS(t)}
            activeRadioButton={analyticsPolicy}
            elementId="analyticsConflictResolution"
            fieldTitle={t(ImportI18nKey.ConflictResolution)}
            orientation={RadioGroupOrientation.Column}
            onChange={(value) => onChangeAnalyticsPolicy(value as CatalogResolutionPolicy)}
          />
        );
      default:
        return (
          <>
            <DialRadioGroup
              radioButtons={IMPORT_RESOLUTIONS(t)}
              activeRadioButton={activeResolution}
              elementId="conflictResolution"
              fieldTitle={t(ImportI18nKey.ConflictResolution)}
              orientation={RadioGroupOrientation.Column}
              onChange={onChangeResolution}
            />
            <div className="h-[104px]">
              <DialRadioGroup
                radioButtons={IMPORT_FILE_TYPES(t)}
                activeRadioButton={fileType}
                elementId="fileType"
                fieldTitle={t(ImportI18nKey.FileType)}
                orientation={RadioGroupOrientation.Column}
                onChange={onChangeFileType}
              />
            </div>
          </>
        );
    }
  };

  const renderFileArea = () => {
    if (isAnalytics) {
      return (
        <DialLoadFileAreaField
          elementId="localFile"
          fieldTitle={t(ImportI18nKey.File)}
          emptyTextFirstLine={t(ImportI18nKey.AnalyticsDropBundle)}
          emptyTextSecondLine={t(BasicI18nKey.Or)}
          emptyButtonLabel={t(ButtonsI18nKey.Browse)}
          maxFilesCount={1}
          files={files.length === 0 ? files : [files[0]]}
          multiple={false}
          fileFormatError={t(ImportI18nKey.JsonFileFormatError)}
          iconBeforeInput={<DialFileIcon extension="json" className="text-secondary" />}
          acceptTypes=".json, application/json"
          onChange={onChangeFile}
        />
      );
    }
    if (isDeployments || fileType === ImportFileType.ARCHIVE) {
      return (
        <DialLoadFileAreaField
          elementId="localFile"
          fieldTitle={t(ImportI18nKey.File)}
          emptyTextFirstLine={t(ImportI18nKey.DropZip)}
          emptyTextSecondLine={t(BasicI18nKey.Or)}
          emptyButtonLabel={t(ButtonsI18nKey.Browse)}
          maxFilesCount={1}
          files={files.length === 0 ? files : [files[0]]}
          multiple={false}
          fileFormatError={t(ImportI18nKey.ArchiveFileFormatError)}
          fileCountError={t(ImportI18nKey.ArchiveDescription)}
          iconBeforeInput={<DialFileIcon extension="zip" className="text-secondary" />}
          acceptTypes=".zip, application/x-zip-compressed, application/zip"
          onChange={onChangeFile}
        />
      );
    }
    return (
      <DialLoadFileAreaField
        elementId="localFile"
        fieldTitle={t(ImportI18nKey.Files)}
        emptyTextFirstLine={t(ImportI18nKey.DropFiles)}
        emptyTextSecondLine={t(BasicI18nKey.Or)}
        emptyButtonLabel={t(ButtonsI18nKey.Browse)}
        files={files}
        iconBeforeInput={<DialFileIcon extension="json" className="text-secondary" />}
        acceptTypes="application/JSON"
        fileFormatError={t(ImportI18nKey.JsonFileFormatError)}
        isInvalid={isLargeFile}
        errorText={t(ImportI18nKey.FileError)}
        onChange={onChangeFile}
        deleteAllButtonLabel={t(ButtonsI18nKey.DeleteAll)}
        addButtonLabel={t(ButtonsI18nKey.Add)}
      />
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 rounded border border-primary p-6 mt-8">
      <div className="mb-2 flex flex-row justify-between">
        <h1>{t(ImportI18nKey.Files)}</h1>
        <DialPrimaryButton
          label={t(ButtonsI18nKey.Next)}
          disabled={!isFilesValid}
          iconAfter={<IconArrowNarrowRight {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onNextStep}
        />
      </div>
      <div className="flex-1 min-h-0 gap-y-8 flex flex-col w-full overflow-auto">
        {scopes.length > 1 && (
          <ConfigScopeSelector scopes={scopes} selectedScope={configScope} onChange={onChangeConfigScope} />
        )}
        {renderOptions()}
        <div className="flex-1 min-h-0">{renderFileArea()}</div>
      </div>
    </div>
  );
};

export default Files;
