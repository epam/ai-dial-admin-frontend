'use client';

import { FC } from 'react';

import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

// A small colored dot marking a column as sensitive (access-restricted). Reused in the table detail
// name cell and the Query Builder field dropdown. It carries no tooltip of its own — both contexts
// already own a cell/row tooltip that explains the flag, so this stays a pure marker (the aria-label
// keeps it accessible) and tooltips never double up.
const SensitiveIndicator: FC = () => {
  const t = useI18n();

  return (
    <span
      role="img"
      aria-label={t(AnalyticsTablesI18nKey.Sensitive)}
      className="size-2 shrink-0 rounded-full bg-yellow-400"
    />
  );
};

export default SensitiveIndicator;
