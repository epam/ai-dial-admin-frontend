import { IconFolderShare } from '@tabler/icons-react';
import { ChangeEvent, FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { DialButton } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { AssetsFolderContext } from '@/src/context/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { PopUpState } from '@/src/types/pop-up';
import FilePathModal from './FilePathModal';

interface Props {
  label: string;
  placeholder: string;
  modalTitle: string;
  disabled?: boolean;
  value?: string;
  onChange: (value: string) => void;
  context: () => AssetsFolderContext<DialFile>;
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
        <DialButton
          disable={disabled}
          cssClass="dial-secondary-button"
          onClick={onOpenFilePathModal}
          title={t(ButtonsI18nKey.Move)}
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
