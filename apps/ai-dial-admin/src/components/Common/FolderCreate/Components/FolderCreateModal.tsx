'use client';

import { FC, useState } from 'react';

import { DialPopup, DialSteps, PopupSize } from '@epam/ai-dial-ui-kit';

import { CREATE_FOLDER_STEPS, CreateFolderSteps } from '@/src/components/Common/FolderCreate/constants';

import { FoldersI18nKey } from '@/src/constants/i18n';
import { IMPORT_FILE_TYPES } from '@/src/constants/import';
import { useI18n } from '@/src/locales/client';
import { DialRule } from '@/src/models/dial/rule';
import { FileImportMap } from '@/src/models/file';
import { ImportData } from '@/src/models/import-asset';
import { ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import FolderCreatePermissions from './FolderCreatePermissions';
import FolderCreateReview from './FolderCreateReview';
import FolderCreateSetup from './FolderCreateSetup';
import { isAssetWithVersion } from '@/src/utils/is-asset-view';
import { getJsonFileName } from '@/src/utils/import/get-json-name';
import StepperModalButtons from '@/src/components/Common/StepperModalButtons/StepperModalButtons';

interface Props {
  isModalOpen: boolean;
  folderPath?: string;
  view?: ApplicationRoute;
  onClose: () => void;
  onApply?: (
    fileType: ImportFileType,
    file: ImportData,
    rules: DialRule[],
    path: string,
    ignorePaths?: boolean,
  ) => void;
}

const FolderCreateModal: FC<Props> = ({ isModalOpen, folderPath, view, onClose, onApply }) => {
  const t = useI18n();

  const fileTypes = IMPORT_FILE_TYPES(t, view);

  const [steps, setSteps] = useState(CREATE_FOLDER_STEPS(t));
  const [currentStepId, setCurrentStepId] = useState(steps[0].id);

  const [ignorePaths, setIgnorePaths] = useState(false);
  const [fileType, setFileType] = useState(fileTypes[0].id);

  const [zipFile, setZipFile] = useState<File | null>();
  const [separateFiles, setSeparateFiles] = useState<File[]>([]);
  const [editedFileMap, setEditedFileMap] = useState(new Map<string, FileImportMap>());

  const [rules, setRules] = useState<DialRule[]>([]);
  const [folderName, setFolderName] = useState('');

  const onFinishClick = () => {
    if (isAssetWithVersion(view)) {
      const type = fileType === ImportFileType.FILES ? ImportFileType.JSON : fileType;
      if (type === ImportFileType.ARCHIVE) {
        onApply?.(type, zipFile as File, rules, `${folderPath}${folderName}`, ignorePaths);
      } else {
        const jsonFile = {
          [getJsonFileName(view)]: Array.from(editedFileMap.values()).flatMap((value) => value.files),
        };
        onApply?.(type as ImportFileType, jsonFile, rules, `${folderPath}${folderName}`, ignorePaths);
      }
    } else if (view === ApplicationRoute.Files) {
      if (fileType === ImportFileType.ARCHIVE) {
        onApply?.(fileType, zipFile as File, rules, `${folderPath}${folderName}/`, ignorePaths);
      } else {
        onApply?.(
          fileType as ImportFileType,
          Array.from(editedFileMap.values()).flatMap((value) => value.files as unknown as File[]),
          rules,
          `${folderPath}${folderName}/`,
          ignorePaths,
        );
      }
    }
  };

  return (
    <DialPopup
      onClose={onClose}
      header={t(FoldersI18nKey.FolderCreate)}
      portalId="CreateFolder"
      open={isModalOpen}
      className="h-[660px]"
      size={PopupSize.Lg}
      footer={
        <StepperModalButtons
          steps={steps}
          currentStep={steps.find((s) => s.id === currentStepId)}
          onChangeStep={setCurrentStepId}
          onFinishClick={onFinishClick}
          onClose={onClose}
        />
      }
    >
      <div className="flex px-6 py-4 h-full flex-col">
        <DialSteps steps={steps} currentStep={currentStepId} onChangeStep={setCurrentStepId} />
        <div
          className={
            currentStepId === CreateFolderSteps.FOLDER_SETUP ? 'flex flex-col flex-1 min-h-0 pt-6 pb-4' : 'hidden'
          }
        >
          <FolderCreateSetup
            view={view}
            fileTypes={fileTypes}
            fileType={fileType}
            setFileType={setFileType}
            files={fileType === ImportFileType.ARCHIVE ? (zipFile ? [zipFile] : []) : separateFiles}
            setZipFile={setZipFile}
            setSeparateFiles={setSeparateFiles}
            setSteps={setSteps}
            folderName={folderName}
            setFolderName={setFolderName}
            ignorePaths={ignorePaths}
            setIgnorePaths={setIgnorePaths}
          />
        </div>
        <div
          className={
            currentStepId === CreateFolderSteps.FILE_REVIEW ? 'flex flex-col flex-1 min-h-0 pt-6 pb-4' : 'hidden'
          }
        >
          <FolderCreateReview
            view={view}
            files={fileType === ImportFileType.ARCHIVE ? (zipFile ? [zipFile] : []) : separateFiles}
            fileType={fileType}
            currentStepId={currentStepId}
            editedFileMap={editedFileMap}
            onChangeFileMap={setEditedFileMap}
            onChangeSteps={setSteps}
          />
        </div>
        <div
          className={
            currentStepId === CreateFolderSteps.PERMISSIONS ? 'flex flex-col flex-1 min-h-0 pt-6 pb-4' : 'hidden'
          }
        >
          <FolderCreatePermissions rules={rules} setRules={setRules} setSteps={setSteps} />
        </div>
      </div>
    </DialPopup>
  );
};

export default FolderCreateModal;
