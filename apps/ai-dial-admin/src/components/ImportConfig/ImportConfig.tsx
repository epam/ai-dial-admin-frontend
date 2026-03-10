'use client';

import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { DialSteps, StepStatus } from '@epam/ai-dial-ui-kit';

import { importDeploymentConfig, importJsonConfigs, importZipConfig } from '@/src/app/[lang]/import-config/actions';
import { IMPORT_CONFIG_STEPS } from '@/src/constants/import';
import { getErrorNotification, getPrepareNotification, getSuccessNotification } from '@/src/utils/notification';
import { ImportI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { ExportComponentType } from '@/src/types/export';
import { ImportFileType, ImportSteps } from '@/src/types/import';
import { useI18n } from '@/src/locales/client';
import { isLargeFile } from '@/src/components/EntityListView/Import/utils';
import Files from './Files/Files';
import ConfigurationPreview from './ConfigurationPreview/ConfigurationPreview';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';

interface Props {
  deploymentsEnabled?: boolean;
}

const ImportConfig: FC<Props> = ({ deploymentsEnabled }) => {
  const t = useI18n();
  const { showNotification, removeNotification } = useNotification();

  const [importBody, setImportBody] = useState<FormData>(new FormData());
  const [files, setFiles] = useState<File[]>([]);
  const [fileType, setFileType] = useState(ImportFileType.ARCHIVE);
  const [configScope, setConfigScope] = useState(ExportComponentType.ADMIN);
  const getReqRef = useRef(useProtectedRequest());

  const isDeployments = configScope === ExportComponentType.DEPLOYMENTS;

  const [steps, setSteps] = useState(IMPORT_CONFIG_STEPS(t));
  const [currentStepId, setCurrentStep] = useState(steps[0].id);

  const onImportFile = useCallback(() => {
    const prepareNotificationId = showNotification(
      getPrepareNotification(t(ImportI18nKey.NotificationImporting), t(ImportI18nKey.NotificationImportingDescription)),
    );

    const importPromise = isDeployments
      ? (() => {
          const resolutionPolicy = importBody.get('resolutionPolicy') as string;
          const fileBody = new FormData();
          const file = importBody.get('file') as File;
          if (file) fileBody.append('file', file);
          return importDeploymentConfig(fileBody, resolutionPolicy);
        })()
      : fileType == ImportFileType.ARCHIVE
        ? getReqRef.current(importZipConfig, importBody)
        : getReqRef.current(importJsonConfigs, importBody);

    importPromise.then((res) => {
      removeNotification(prepareNotificationId);
      if (res.success) {
        showNotification(
          getSuccessNotification(t(ImportI18nKey.ConfigImported), t(ImportI18nKey.ConfigImportedDescription)),
        );
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [showNotification, t, fileType, importBody, removeNotification, isDeployments]);

  const setStepsState = useCallback(
    (status: StepStatus) => {
      setSteps((previousSteps) => {
        const index = previousSteps.findIndex((step) => step.id === currentStepId);
        return previousSteps.map((item, stepPosition) => (stepPosition === index ? { ...item, status } : item));
      });
    },
    [currentStepId],
  );

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
  }, []);

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
          importBody={importBody}
          fileType={fileType}
          isDeployments={isDeployments}
        />
      )}
    </div>
  );
};

export default ImportConfig;
