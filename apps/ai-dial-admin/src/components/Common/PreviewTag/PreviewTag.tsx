import { Badge, BadgeColor, BadgeVariant } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

export const PreviewTag: FC = () => {
  const t = useI18n();

  return <Badge label={t(BasicI18nKey.Preview)} variant={BadgeVariant.Filled} color={BadgeColor.Blue} />;
};
