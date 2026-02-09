'use client';

import { DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { IconEdit } from '@tabler/icons-react';

interface Props {
  file: File | null;
  onChangeFile: (files: File[]) => void;
}

const SelectedFile: FC<Props> = ({ file, onChangeFile }) => {
  const t = useI18n();

  return (
    <div className="flex flex-row justify-between items-center bg-layer-2 px-3 py-0.5">
      <span>{file?.name}</span>

      <DialPrimaryButton
        iconBefore={<IconEdit {...BASE_BUTTON_ICON_PROPS} />}
        label={t(ButtonsI18nKey.Change)}
        onClick={() => onChangeFile([])}
      />
    </div>
  );
};

export default SelectedFile;
