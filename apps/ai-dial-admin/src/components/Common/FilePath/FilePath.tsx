import { ChangeEvent, FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconFolderShare } from '@tabler/icons-react';
import classNames from 'classnames';

import { FileManagerI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH, STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { Asset } from '@/src/models/dial/deployment-asset';
import FilePathModal from './FilePathModal';

interface Props {
  label: string;
  placeholder: string;
  modalTitle: string;
  disabled?: boolean;
  value?: string;
  onChange: (value: string) => void;
  context?: () => AssetsFolderContext<Asset>;
}

const FilePath: FC<Props> = ({ label, placeholder, disabled, value, modalTitle, onChange, context }) => {
  const t = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onPathChange(event.target.value);
  };

  const onPathChange = (value: string) => {
    onChange(value);
  };

  const onOpenFilePathModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseFilePathModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  return (
    <div className={classNames('flex flex-col', STANDARD_CONTROL_WIDTH)}>
      <label className="tiny mb-2 text-secondary" htmlFor="pathSelectButton">
        {label}
      </label>
      <div className="flex gap-2">
        <div className={CONTROL_WITH_BUTTON_WIDTH}>
          <input
            disabled={disabled}
            type="text"
            value={value}
            onChange={onInputChange}
            placeholder={placeholder}
            className="dial-input dial-input-field py-2 px-3"
          />
        </div>
        <DialNeutralButton
          disabled={disabled}
          onClick={onOpenFilePathModal}
          label={t(FileManagerI18nKey.Move)}
          iconBefore={<IconFolderShare {...BASE_BUTTON_ICON_PROPS} />}
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
