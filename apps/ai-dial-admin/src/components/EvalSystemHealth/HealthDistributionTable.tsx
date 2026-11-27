'use client';

import { FC } from 'react';

import { formatPercent } from '@/src/components/Analytics/Usage/utils/format';
import { HealthDistributionBar } from '@/src/components/EvalSystemHealth/models';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  bars: HealthDistributionBar[];
  /** The accessible name: the section's title. */
  label: string;
}

const NO_FIGURE = '—';

const formatCount = (count: number, share: number | null): string =>
  share == null ? NO_FIGURE : `${count} (${formatPercent(share / 100)})`;

/** The chart's figures as a table for assistive technology, since a canvas tooltip needs a pointer. */
const HealthDistributionTable: FC<Props> = ({ bars, label }) => {
  const t = useI18n();

  return (
    <table className="sr-only" aria-label={label}>
      <thead>
        <tr>
          <th scope="col">{t(EvalSystemHealthI18nKey.HealthDistributionColumnWeek)}</th>
          <th scope="col">{t(EvalSystemHealthI18nKey.HealthDistributionColumnHealthy)}</th>
          <th scope="col">{t(EvalSystemHealthI18nKey.HealthDistributionColumnFail)}</th>
        </tr>
      </thead>
      <tbody>
        {bars.map((bar) => (
          <tr key={bar.weekStart}>
            <th scope="row">{bar.label}</th>
            <td>{formatCount(bar.healthyCount, bar.healthyShare)}</td>
            <td>{formatCount(bar.failingCount, bar.failingShare)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default HealthDistributionTable;
