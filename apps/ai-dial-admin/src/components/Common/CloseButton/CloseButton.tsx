'use client';

import { DialCloseButton } from '@epam/ai-dial-ui-kit';
import { FC, MouseEvent } from 'react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  cssClass?: string;
  size?: number;
  onClose: (e: MouseEvent<HTMLButtonElement>) => void;
}

const CloseButton: FC<Props> = ({ ...props }) => {
  const t = useI18n();

  return <DialCloseButton ariaLabel={t(ButtonsI18nKey.Close)} {...props} />;
};

export default CloseButton;
