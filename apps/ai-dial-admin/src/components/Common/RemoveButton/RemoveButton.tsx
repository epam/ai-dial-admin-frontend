'use client';

import { ButtonAppearance, ButtonVariant, DIAL_ICON_SIZE, IconButton, IconButtonProps } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';
import { FC } from 'react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

type Props = Omit<IconButtonProps, 'icon' | 'variant' | 'appearance'>;

const RemoveButton: FC<Props> = (props) => {
  const t = useI18n();

  return (
    <IconButton
      aria-label={t(ButtonsI18nKey.Delete)}
      {...props}
      variant={ButtonVariant.Danger}
      appearance={ButtonAppearance.Outlined}
      icon={<IconTrashX size={DIAL_ICON_SIZE.SM} aria-hidden />}
    />
  );
};

export default RemoveButton;
