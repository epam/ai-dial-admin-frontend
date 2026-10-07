'use client';

import { NotificationVariant, DialNotification, DialSteps, StepStatus } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useRef, useState } from 'react';

import {
  importAnalyticsConfig,
  importDeploymentConfig,
  importJsonConfigs,
  importZipConfig,
} from '@/src/app/[lang]/import-config/actions';
import { isLargeFile } from '@/src/components/EntityListView/Import/utils';
import { ImportI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { IMPORT_CONFIG_STEPS } from '@/src/constants/import';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { CatalogImportResult } from '@/src/models/analytics/catalog-import';
import { ServerActionResponse } from '@/src/models/server-action';
import { CatalogResolutionPolicy } from '@/src/types/analytics/import';
import { ExportComponentType } from '@/src/types/export';
import { ImportFileType, ImportSteps } from '@/src/types/import';
import { isUnreachableResponse } from '@/src/utils/api/is-unreachable-response';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import ConfigurationPreview from './ConfigurationPreview/ConfigurationPreview';
import Files from './Files/Files';

interface Props {
  deploymentsEnabled?: boolean;
  isAnalyticsEnabled?: boolean;
}

const ImportConfig: FC<Props> = ({ deploymentsEnabled, isAnalyticsEnabled }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { showNotification } = useNotification();

  const [importBody, setImportBody] = useState<FormData>(new FormData());
  const [files, setFiles] = useState<File[]>([]);
  const [fileType, setFileType] = useState(ImportFileType.ARCHIVE);
  const [configScope, setConfigScope] = useState(ExportComponentType.ADMIN);
  const getReqRef = useRef(useProtectedRequest());
  const [isImporting, setIsImporting] = useState(false);
  const [analyticsPolicy, setAnalyticsPolicy] = useState(CatalogResolutionPolicy.FAIL_IF_EXISTS);
  const [isReusedNamesAcknowledged, setIsReusedNamesAcknowledged] = useState(false);
  const [analyticsResult, setAnalyticsResult] = useState<CatalogImportResult>();

  const [steps, setSteps] = useState(IMPORT_CONFIG_STEPS(t));
  const [currentStepId, setCurrentStep] = useState(steps[0].id);

  const runImport = useCallback((): Promise<ServerActionResponse> => {
    switch (configScope) {
      case ExportComponentType.DEPLOYMENTS: {
        const fileBody = new FormData();
        const file = importBody.get('file') as File;
        if (file) fileBody.append('file', file);
        return importDeploymentConfig(fileBody, importBody.get('resolutionPolicy') as string);
      }
      case ExportComponentType.ANALYTICS:
        return getReqRef.current(importAnalyticsConfig, importBody, analyticsPolicy, isReusedNamesAcknowledged);
      default:
        return fileType === ImportFileType.ARCHIVE
          ? getReqRef.current(importZipConfig, importBody)
          : getReqRef.current(importJsonConfigs, importBody);
    }
  }, [configScope, importBody, analyticsPolicy, isReusedNamesAcknowledged, fileType]);

  const onImportFile = useCallback(async () => {
    setIsImporting(true);
    let res: ServerActionResponse;
    try {
      res = await runImport();
    } catch {
      // The Deployments branch calls its action directly, so a rejection lands here rather than in an envelope.
      res = { success: false };
    } finally {
      setIsImporting(false);
    }

    if (!res.success) {
      const isUnreachableAnalytics = configScope === ExportComponentType.ANALYTICS && isUnreachableResponse(res);
      const message = isUnreachableAnalytics ? t(ImportI18nKey.AnalyticsImportFailed) : res.errorMessage;
      showNotification(getErrorNotification(res.errorHeader, message, res.requestId));
      return;
    }
    // The Analytics result is shown in place: its outcome can be a rollback, which a toast cannot explain.
    if (configScope === ExportComponentType.ANALYTICS) {
      setAnalyticsResult(res.response as CatalogImportResult);
      return;
    }
    showNotification(
      getSuccessNotification(t(ImportI18nKey.ConfigImported), t(ImportI18nKey.ConfigImportedDescription)),
    );
    setCurrentStep(steps[0].id);
  }, [runImport, configScope, showNotification, t, steps]);

  const setStepsState = useCallback(
    (status: StepStatus) => {
      setSteps((previousSteps) => {
        const index = previousSteps.findIndex((step) => step.id === currentStepId);
        return previousSteps.map((item, stepPosition) => (stepPosition === index ? { ...item, status } : item));
      });
    },
    [currentStepId],
  );

  const onValidationChange = useCallback((hasErrors: boolean) => {
    setSteps((previousSteps) =>
      previousSteps.map((step) =>
        step.id === ImportSteps.CONFIGURATION
          ? { ...step, status: hasErrors ? StepStatus.ERROR : StepStatus.VALID }
          : step,
      ),
    );
  }, []);

  const isFilesValid = useCallback(() => {
    return files?.length && files.every((file) => !isLargeFile(file));
  }, [files]);

  useEffect(() => {
    if (isFilesValid()) {
      setStepsState(StepStatus.VALID);
    } else {
      setSteps((previousSteps) => {
        return previousSteps.map((previousStep) => ({
          ...previousStep,
          status: void 0,
        }));
      });
    }
  }, [files, setStepsState, isFilesValid]);

  const onNextStep = useCallback(() => {
    const stepIndex = steps.findIndex((step) => step.id === currentStepId);
    setCurrentStep(steps[stepIndex + 1].id);
  }, [steps, currentStepId]);

  const onChangeConfigScope = useCallback((value: string) => {
    setConfigScope(value as ExportComponentType);
    setFiles([]);
    setFileType(ImportFileType.ARCHIVE);
    setAnalyticsPolicy(CatalogResolutionPolicy.FAIL_IF_EXISTS);
  }, []);

  // A new file, policy or scope is a new import: the confirmation and any previous result no longer apply to it.
  useEffect(() => {
    setIsReusedNamesAcknowledged(false);
    setAnalyticsResult(undefined);
  }, [files, analyticsPolicy, configScope]);

  const onChangeFileType = useCallback(
    (value: string) => {
      setFileType(value as ImportFileType);
      setFiles([]);
    },
    [setFileType, setFiles],
  );

  const onChangeImportBody = useCallback((importBody: FormData) => {
    setImportBody(importBody);
  }, []);

  if (isReadOnlyAdmin) {
    return (
      <div className="flex flex-col size-full rounded p-4 bg-layer-2 gap-4">
        <h1>{t(MenuI18nKey.ImportConfig)}</h1>
        <DialNotification variant={NotificationVariant.Info} message={t(MenuI18nKey.ReadOnlyAdminImportUnavailable)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col size-full rounded p-4 bg-layer-2">
      <DialSteps steps={steps} currentStep={currentStepId} onChangeStep={setCurrentStep} />
      {currentStepId === ImportSteps.FILES && (
        <Files
          files={files}
          fileType={fileType}
          isFilesValid={!!isFilesValid()}
          configScope={configScope}
          deploymentsEnabled={deploymentsEnabled}
          isAnalyticsEnabled={isAnalyticsEnabled}
          analyticsPolicy={analyticsPolicy}
          onChangeAnalyticsPolicy={setAnalyticsPolicy}
          onChangeFileType={onChangeFileType}
          onChangeFiles={(files) => setFiles(files)}
          onChangeImportBody={onChangeImportBody}
          onChangeConfigScope={onChangeConfigScope}
          onNextStep={onNextStep}
        />
      )}
      {currentStepId === ImportSteps.CONFIGURATION && (
        <ConfigurationPreview
          files={files}
          onImportFile={onImportFile}
          isImporting={isImporting}
          importBody={importBody}
          fileType={fileType}
          configScope={configScope}
          analyticsPolicy={analyticsPolicy}
          analyticsResult={analyticsResult}
          isReusedNamesAcknowledged={isReusedNamesAcknowledged}
          onChangeReusedNamesAcknowledged={setIsReusedNamesAcknowledged}
          onValidationChange={onValidationChange}
        />
      )}
    </div>
  );
};

export default ImportConfig;
