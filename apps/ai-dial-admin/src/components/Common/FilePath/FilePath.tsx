import { ChangeEvent, FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';
import { IconFolderShare } from '@tabler/icons-react';
import classNames from 'classnames';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import FilePathModal from './FilePathModal';

interface Props {
  label: string;
  placeholder: string;
  modalTitle: string;
  disabled?: boolean;
  value?: string;
  inputClassName?: string;
  onChange: (value: string) => void;
  context: () => AssetsFolderContext<DialFile>;
}

const FilePath: FC<Props> = ({
  label,
  placeholder,
  disabled,
  value,
  modalTitle,
  inputClassName,
  onChange,
  context,
}) => {
  const t = useI18n();
  const [filePath, setFilePath] = useState(value);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onPathChange(event.target.value);
  };

  const onPathChange = (value: string) => {
    setFilePath(value);
    onChange(value);
  };

  const onOpenFilePathModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseFilePathModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  return (
    <div className="flex flex-col">
      <label className="tiny mb-2 text-secondary" htmlFor="pathSelectButton">
        {label}
      </label>
      <div className="flex gap-4">
        <div className={classNames('flex', inputClassName)}>
          <input
            disabled={disabled}
            type="text"
            value={filePath}
            onChange={onInputChange}
            placeholder={placeholder}
            className="dial-input py-2 px-3"
          />
        </div>
        <DialButton
          disabled={disabled}
          variant={ButtonVariant.Secondary}
          onClick={onOpenFilePathModal}
          label={t(ButtonsI18nKey.Move)}
          iconBefore={<IconFolderShare {...BASE_ICON_PROPS} />}
        />
      </div>
      {isModalOpen &&
        createPortal(
          <FilePathModal
            modalTitle={modalTitle}
            isModalOpen={isModalOpen}
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
