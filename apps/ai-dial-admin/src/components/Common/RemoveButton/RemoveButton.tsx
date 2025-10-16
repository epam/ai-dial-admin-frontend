'use client';

import { FC, MouseEvent } from 'react';

import { DialButton } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  iconClass?: string;
  cssClass?: string;
  onClick: (e: MouseEvent) => void;
}

const RemoveButton: FC<Props> = ({ iconClass, ...props }) => {
  const t = useI18n();

  return (
    <DialButton
      ariaLabel={t(ButtonsI18nKey.Remove)}
      iconBefore={<IconTrashX {...BASE_ICON_PROPS} className={iconClass || ''} />}
      {...props}
    />
  );
};

export default RemoveButton;
