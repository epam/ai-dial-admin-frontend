'use client';

import { ButtonAppearance, DangerButton, DIAL_ICON_SIZE, GhostIconButton } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';
import { FC } from 'react';

import { RemoveButtonProps } from '@/src/components/Common/RemoveButton/models';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

// The one delete/remove control: bordered when it carries a label, borderless when icon-only.
const RemoveButton: FC<RemoveButtonProps> = (props) => {
  const t = useI18n();

  if (props.label != null) {
    return (
      <DangerButton
        {...props}
        appearance={ButtonAppearance.Outlined}
        iconBefore={<IconTrashX {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
      />
    );
  }

  return (
    <GhostIconButton
      aria-label={t(ButtonsI18nKey.Delete)}
      {...props}
      icon={<IconTrashX size={DIAL_ICON_SIZE.SM} className="text-error" aria-hidden />}
    />
  );
};

export default RemoveButton;
