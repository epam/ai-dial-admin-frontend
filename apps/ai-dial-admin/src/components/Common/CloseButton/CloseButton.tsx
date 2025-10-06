'use client';

import { DialButton } from '@epam/ai-dial-ui-kit';
import { IconX } from '@tabler/icons-react';
import { FC, MouseEvent } from 'react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  cssClass?: string;
  size?: number;
  onClose: (e: MouseEvent<HTMLButtonElement>) => void;
}

const CloseButton: FC<Props> = ({ onClose }) => {
  const t = useI18n();

  return (
    <DialButton
      ariaLabel={t(ButtonsI18nKey.Close)}
      cssClass="text-secondary hover:text-accent-primary"
      onClick={onClose}
      iconBefore={<IconX height={24} width={24} />}
    />
  );
};

export default CloseButton;
