import { BadgeColor } from '@epam/ai-dial-ui-kit';

import { MenuBadge } from '@/src/components/Menu/menu-configuration';
import { BasicI18nKey } from '@/src/constants/i18n';

export const MENU_BADGES: Record<MenuBadge, { labelKey: BasicI18nKey; color: BadgeColor }> = {
  [MenuBadge.Preview]: { labelKey: BasicI18nKey.Preview, color: BadgeColor.Blue },
  [MenuBadge.Deprecated]: { labelKey: BasicI18nKey.Deprecated, color: BadgeColor.Brown },
};

export const MENU_ENTRY_CLASS_NAME =
  'flex items-center h-9 px-3 rounded-full cursor-pointer text-sm font-normal leading-5 hover:bg-control-neutral-hover-muted focus-visible:bg-control-neutral-hover-muted';
export const MENU_ENTRY_ACTIVE_CLASS_NAME =
  'bg-control-accent-alpha text-accent hover:bg-control-accent-alpha-hover focus-visible:bg-control-accent-alpha-hover';
export const MENU_ENTRY_INACTIVE_CLASS_NAME = 'text-primary';
