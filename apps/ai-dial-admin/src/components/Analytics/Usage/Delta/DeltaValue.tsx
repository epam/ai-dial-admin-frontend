'use client';

import { FC } from 'react';

import { IconArrowDown, IconArrowUp } from '@tabler/icons-react';
import classNames from 'classnames';

import { KpiMetric } from '@/src/components/Analytics/Usage/models';
import { DELTA_TONE_CLASS, getDeltaTone } from '@/src/components/Analytics/Usage/utils/delta-tone';
import { formatPercent } from '@/src/components/Analytics/Usage/utils/format';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  ratio: number;
  metric: KpiMetric;
  className?: string;
}

const ARROW_SIZE = 14;
const ARROW_STROKE = 2;

/**
 * A change, as a direction and a magnitude.
 *
 * The arrow carries the direction rather than a `+` / `-`, which is easy to miss at this size, and
 * it is a shape — so direction survives where the tone colour does not. Screen readers get the
 * direction as a word, since an icon and a colour say nothing to them.
 */
const DeltaValue: FC<Props> = ({ ratio, metric, className }) => {
  const t = useI18n();

  const magnitude = formatPercent(Math.abs(ratio));
  const isRise = ratio > 0;
  const Arrow = isRise ? IconArrowUp : IconArrowDown;

  return (
    <span
      className={classNames(
        'inline-flex items-center gap-0.5',
        DELTA_TONE_CLASS[getDeltaTone(metric, ratio)],
        className,
      )}
    >
      {ratio !== 0 && <Arrow size={ARROW_SIZE} stroke={ARROW_STROKE} aria-hidden />}
      <span aria-hidden>{magnitude}</span>
      {ratio !== 0 && (
        <span className="sr-only">
          {t(isRise ? AnalyticsUsageI18nKey.KpiDeltaIncrease : AnalyticsUsageI18nKey.KpiDeltaDecrease, {
            value: magnitude,
          })}
        </span>
      )}
    </span>
  );
};

export default DeltaValue;
