'use client';

import { DialButton } from '@epam/ai-dial-ui-kit';
import { FC, MouseEvent } from 'react';
import { IconTrashX } from '@tabler/icons-react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';

interface Props {
  cssClass?: string;
  onClick: (e: MouseEvent) => void;
}

const RemoveButton: FC<Props> = ({ ...props }) => {
  const t = useI18n();

  return (
    <DialButton ariaLabel={t(ButtonsI18nKey.Remove)} iconBefore={<IconTrashX {...BASE_ICON_PROPS} />} {...props} />
  );
};

export default RemoveButton;
