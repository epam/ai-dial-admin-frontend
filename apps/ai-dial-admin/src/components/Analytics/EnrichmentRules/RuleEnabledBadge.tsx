import { FC } from 'react';

import classNames from 'classnames';

import { AnalyticsEnrichmentRulesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  enabled?: boolean;
  className?: string;
}

const RuleEnabledBadge: FC<Props> = ({ enabled, className }) => {
  const t = useI18n();

  if (enabled == null) {
    return null;
  }

  return (
    <div
      className={classNames(
        'flex items-center gap-x-1 py-1 px-2 uppercase dial-caption-text font-semibold rounded-full',
        enabled ? 'text-success bg-success' : 'text-secondary bg-layer-4',
        className,
      )}
    >
      <span>
        {t(enabled ? AnalyticsEnrichmentRulesI18nKey.StatusEnabled : AnalyticsEnrichmentRulesI18nKey.StatusDisabled)}
      </span>
    </div>
  );
};

export default RuleEnabledBadge;
