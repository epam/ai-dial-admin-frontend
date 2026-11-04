'use client';

import { FC } from 'react';

import { Badge, BadgeColor, BadgeVariant } from '@epam/ai-dial-ui-kit';

import { ErrorI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

/** Error badge for one side of a compare card; single-run cards use the kit card's own `error` state. */
const ErrorTag: FC = () => {
  const t = useI18n();

  return <Badge label={t(ErrorI18nKey.Error)} variant={BadgeVariant.Filled} color={BadgeColor.Red} />;
};

export default ErrorTag;
