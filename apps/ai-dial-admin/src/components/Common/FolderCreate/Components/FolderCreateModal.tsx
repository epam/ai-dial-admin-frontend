'use client';

import { FC, useState } from 'react';

import classNames from 'classnames';

import { CREATE_FOLDER_STEPS, CreateFolderSteps } from '@/src/components/Common/FolderCreate/constants';
import Popup from '@/src/components/Common/Popup/Popup';
import Steps from '@/src/components/Common/Steps/Steps';
import { FoldersI18nKey } from '@/src/constants/i18n';
import { IMPORT_FILE_TYPES } from '@/src/constants/import';
import { useI18n } from '@/src/locales/client';
import { DialPrompt } from '@/src/models/dial/prompt';
import { DialRule } from '@/src/models/dial/rule';
import { FileImportMap } from '@/src/models/file';
import { ParsedPrompts } from '@/src/models/prompts';
import { Step } from '@/src/models/step';
import { ImportFileType } from '@/src/types/import';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import FolderCreateModalButtons from './FolderCreateModalButtons';
import FolderCreatePermissions from './FolderCreatePermissions';
import FolderCreateReview from './FolderCreateReview';
import FolderCreateSetup from './FolderCreateSetup';

interface Props {
  modalState: PopUpState;
  folderPath?: string;
  view?: ApplicationRoute;
  onClose: () => void;
  onApply?: (fileType: ImportFileType, file: File | File[] | ParsedPrompts, rules: DialRule[], path: string) => void;
}

const FolderCreateModal: FC<Props> = ({ modalState, folderPath, view, onClose, onApply }) => {
  const containerClassName = classNames('h-[660px] lg:max-w-[65%]');
  const t = useI18n() as (stringToTranslate: string) => string;

  const fileTypes = IMPORT_FILE_TYPES(t, ApplicationRoute.Files);

  const [steps, setSteps] = useState(CREATE_FOLDER_STEPS(t));
  const [currentStep, setCurrentStep] = useState<Step>(steps[0]);

  const [fileType, setFileType] = useState(fileTypes[0].id);

  const [zipFile, setZipFile] = useState<File | null>();
  const [separateFiles, setSeparateFiles] = useState<File[]>([]);
  const [editedFileMap, setEditedFileMap] = useState(new Map<string, FileImportMap>());

  const [rules, setRules] = useState<DialRule[]>([]);
  const [folderName, setFolderName] = useState('');

  const onFinishClick = () => {
    const isPromptView = view === ApplicationRoute.Prompts;
    if (isPromptView) {
      const type = fileType === ImportFileType.FILES ? ImportFileType.JSON : fileType;
      if (type === ImportFileType.ARCHIVE) {
        onApply?.(type, zipFile as File, rules, `${folderPath}${folderName}`);
      } else {
        const jsonFile = {
          prompts: Array.from(editedFileMap.values()).flatMap((value) => value.files as DialPrompt[]),
        };
        onApply?.(type as ImportFileType, jsonFile, rules, `${folderPath}${folderName}`);
      }
    }
  };

  return (
    <Popup
      onClose={onClose}
      heading={t(FoldersI18nKey.FolderCreate)}
      portalId="CreateFolder"
      state={modalState}
      containerClassName={containerClassName}
    >
      <div className="flex px-6 py-4 flex-1 flex-col min-h-0">
        <Steps steps={steps} currentStep={currentStep} setCurrentStep={setCurrentStep} />
        <div
          className={
            currentStep.id === CreateFolderSteps.FOLDER_SETUP ? 'flex flex-col flex-1 min-h-0 pt-6 pb-4' : 'hidden'
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
            setCurrentStep={setCurrentStep}
            folderName={folderName}
            setFolderName={setFolderName}
          />
        </div>
        <div
          className={
            currentStep.id === CreateFolderSteps.FILE_REVIEW ? 'flex flex-col flex-1 min-h-0 pt-6 pb-4' : 'hidden'
          }
        >
          <FolderCreateReview
            view={view}
            files={fileType === ImportFileType.ARCHIVE ? (zipFile ? [zipFile] : []) : separateFiles}
            fileType={fileType}
            currentStep={currentStep}
            editedFileMap={editedFileMap}
            setEditedFileMap={setEditedFileMap}
            setSteps={setSteps}
            setCurrentStep={setCurrentStep}
          />
        </div>
        <div
          className={
            currentStep.id === CreateFolderSteps.PERMISSIONS ? 'flex flex-col flex-1 min-h-0 pt-6 pb-4' : 'hidden'
          }
        >
          <FolderCreatePermissions
            rules={rules}
            setRules={setRules}
            setSteps={setSteps}
            setCurrentStep={setCurrentStep}
          />
        </div>
      </div>

      <FolderCreateModalButtons
        steps={steps}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        onFinishClick={onFinishClick}
        onClose={onClose}
      />
    </Popup>
  );
};

export default FolderCreateModal;
