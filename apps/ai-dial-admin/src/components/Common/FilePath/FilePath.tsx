import { IconFolderShare } from '@tabler/icons-react';
import { ChangeEvent, FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import Button from '@/src/components/Common/Button/Button';
import { BasicI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { PromptFolderContextType } from '@/src/context/PromptFolderContext';
import { FileFolderContextType } from '@/src/context/FileFolderContext';
import FilePathModal from './FilePathModal';
import { PopUpState } from '@/src/types/pop-up';

interface Props {
  label: string;
  placeholder: string;
  modalTitle: string;
  disabled?: boolean;
  value?: string;
  onChange: (value: string) => void;
  context: () => PromptFolderContextType | FileFolderContextType;
}

const FilePath: FC<Props> = ({ label, placeholder, disabled, value, modalTitle, onChange, context }) => {
  const t = useI18n();
  const [filePath, setFilePath] = useState(value);
  const [filePathModalState, setFilePathModalState] = useState(PopUpState.Closed);

  const onInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onPathChange(event.target.value);
  };

  const onPathChange = (value: string) => {
    setFilePath(value);
    onChange(value);
  };

  const onOpenFilePathModal = useCallback(() => {
    setFilePathModalState(PopUpState.Opened);
  }, [setFilePathModalState]);

  const onCloseFilePathModal = useCallback(() => {
    setFilePathModalState(PopUpState.Closed);
  }, [setFilePathModalState]);

  return (
    <div className="flex flex-col">
      <label className="tiny mb-2 text-secondary" htmlFor="pathSelectButton">
        {label}
      </label>
      <div className="flex">
        <input
          disabled={disabled}
          type="text"
          value={filePath}
          onChange={onInputChange}
          placeholder={placeholder}
          className="input mr-4 flex-1"
        />
        <Button
          disable={disabled}
          cssClass="secondary"
          onClick={onOpenFilePathModal}
          title={t(BasicI18nKey.Move)}
          iconBefore={<IconFolderShare {...BASE_ICON_PROPS} />}
        />
      </div>
      {filePathModalState === PopUpState.Opened &&
        createPortal(
          <FilePathModal
            modalTitle={modalTitle}
            modalState={filePathModalState}
            onClose={onCloseFilePathModal}
            onApply={onPathChange}
            initialPath={value}
            context={context}
          />,
          document.body,
        )}
    </div>
  );
};

export default FilePath;
