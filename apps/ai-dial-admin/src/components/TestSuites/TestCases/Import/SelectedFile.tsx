'use client';

import { ButtonAppearance, DialFileIcon, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { ChangeEvent, FC, useCallback, useRef } from 'react';
import { IconEdit } from '@tabler/icons-react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  file: File | null;
  onChangeFile: (files: File[]) => void;
}

const SelectedFile: FC<Props> = ({ file, onChangeFile }) => {
  const t = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const filesList = e.target.files;
      if (filesList && filesList.length > 0) {
        const selectedFiles = Array.from(filesList);
        onChangeFile(selectedFiles);
      }
    },
    [onChangeFile],
  );
  return (
    <div className="flex flex-row justify-between items-center bg-layer-2 px-3 py-0.5">
      <div className="flex items-center gap-x-2">
        <DialFileIcon extension=".csv" className="text-secondary" />
        <span className="text-primary dial-small-text">{file?.name}</span>
      </div>

      <div>
        <label htmlFor="file" tabIndex={0}>
          <DialPrimaryButton
            iconBefore={<IconEdit {...BASE_BUTTON_ICON_PROPS} />}
            appearance={ButtonAppearance.Ghost}
            label={t(ButtonsI18nKey.Change)}
            onClick={() => fileInputRef.current?.click()}
          />
        </label>
        <input id="file" type="file" ref={fileInputRef} hidden accept="text/csv" onChange={onFileChange} />
      </div>
    </div>
  );
};

export default SelectedFile;
