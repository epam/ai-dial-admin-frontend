import { FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialInput, DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconFolderShare } from '@tabler/icons-react';

import { ActionMenuOperationI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import FilePathModal from './FilePathModal';

interface Props {
  label: string;
  placeholder: string;
  modalTitle: string;
  disabled?: boolean;
  value?: string;
  onChange: (value: string) => void;
  context?: () => AssetsFolderContext;
}

const FilePath: FC<Props> = ({ label, placeholder, disabled, value, modalTitle, onChange, context }) => {
  const t = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onInputChange = (value?: string) => {
    onChange(value || '');
  };

  const onOpenFilePathModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseFilePathModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  return (
    <div className="flex">
      <div className="flex gap-x-2 items-end">
        <div className={CONTROL_WITH_BUTTON_WIDTH}>
          <DialInput
            id="filePath"
            disabled={disabled}
            value={value}
            onChange={onInputChange}
            placeholder={placeholder}
            labelProps={{ label }}
          />
        </div>
        <DialNeutralButton
          disabled={disabled}
          onClick={onOpenFilePathModal}
          label={t(ActionMenuOperationI18nKey.Move_to)}
          iconBefore={<IconFolderShare {...BASE_BUTTON_ICON_PROPS} />}
        />

        {isModalOpen &&
          createPortal(
            <FilePathModal
              modalTitle={modalTitle}
              isModalOpen={isModalOpen}
              onClose={onCloseFilePathModal}
              onApply={onChange}
              initialPath={value}
              context={context}
            />,
            document.body,
          )}
      </div>
    </div>
  );
};

export default FilePath;
