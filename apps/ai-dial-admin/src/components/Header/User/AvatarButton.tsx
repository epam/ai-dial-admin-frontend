import { ButtonAppearance, ButtonVariant, IconButton, TooltipPlacement } from '@epam/ai-dial-ui-kit';
import { IconX } from '@tabler/icons-react';
import { ButtonHTMLAttributes, FC } from 'react';

import { ButtonsI18nKey, HeaderI18nKey } from '@/src/constants/i18n';
import { TOOLTIP_PLACEMENT_BOTTOM_END } from '@/src/constants/tooltip';
import { useI18n } from '@/src/locales/client';
import { UserIcon } from './UserMenu/UserIcon';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  tooltip?: string;
}

const AvatarButton: FC<Props> = ({ isActive, tooltip, ...buttonProps }) => {
  const t = useI18n();
  const name = isActive ? t(ButtonsI18nKey.Close) : t(HeaderI18nKey.AccountSettings);

  return (
    <IconButton
      variant={isActive ? ButtonVariant.Neutral : ButtonVariant.Primary}
      appearance={isActive ? ButtonAppearance.Outlined : ButtonAppearance.Ghost}
      aria-label={name}
      tooltipProps={{
        tooltip: isActive ? name : tooltip || name,
        placement: isActive ? TooltipPlacement.Left : TOOLTIP_PLACEMENT_BOTTOM_END,
      }}
      {...buttonProps}
      icon={isActive ? <IconX size={20} stroke={1.5} aria-hidden /> : <UserIcon />}
    />
  );
};

export default AvatarButton;
