import { BadgeColor } from '@epam/ai-dial-ui-kit';

import { MenuBadge } from '@/src/components/Menu/menu-configuration';
import { BasicI18nKey } from '@/src/constants/i18n';

export const MENU_BADGES: Record<MenuBadge, { labelKey: BasicI18nKey; color: BadgeColor }> = {
  [MenuBadge.Preview]: { labelKey: BasicI18nKey.Preview, color: BadgeColor.Blue },
  [MenuBadge.Deprecated]: { labelKey: BasicI18nKey.Deprecated, color: BadgeColor.Brown },
};
