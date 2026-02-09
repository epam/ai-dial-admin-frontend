'use client';

import { ButtonAppearance, DialFileIcon, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';
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

  return (
    <div className="flex flex-row justify-between items-center bg-layer-2 px-3 py-0.5">
      <div className="flex items-center gap-x-2">
        <DialFileIcon extension=".csv" className="text-secondary" />
        <span className="text-primary dial-small-text">{file?.name}</span>
      </div>

      <DialPrimaryButton
        iconBefore={<IconEdit {...BASE_BUTTON_ICON_PROPS} />}
        appearance={ButtonAppearance.Ghost}
        label={t(ButtonsI18nKey.Change)}
        onClick={() => onChangeFile([])}
      />
    </div>
  );
};

export default SelectedFile;
