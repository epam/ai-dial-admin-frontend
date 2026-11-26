'use client';

import classNames from 'classnames';

import { ICellRendererParams } from 'ag-grid-community';

import { PASS_RATE_BAND_CLASS } from '@/src/components/Common/PassRateBar/constants';
import { formatPassRatePercent, getPassRateBand } from '@/src/components/Common/PassRateBar/utils';
import { RunTrendRow } from '@/src/components/EvalSystemHealth/models';
import { getBarHeightPercent } from '@/src/components/EvalSystemHealth/utils/get-bar-height';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

/** One bar per run, oldest on the left; the chart is decorative and the hidden text carries the rates. */
const RunTrendBarsCell = ({ data }: ICellRendererParams<RunTrendRow>) => {
  const t = useI18n();
  const points = data?.points ?? [];

  if (points.length === 0) {
    return null;
  }

  const rates = points.map(formatPassRatePercent).join(', ');

  return (
    <div className="flex size-full items-center">
      <div className="flex h-8 items-end gap-1" aria-hidden>
        {points.map((rate, index) => (
          <div
            // The runs only ever render in the order given, never reordered, so the position is a stable key.
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className={classNames('w-2.5 rounded-t-sm', PASS_RATE_BAND_CLASS[getPassRateBand(rate)])}
            style={{ height: `${getBarHeightPercent(rate)}%` }}
          />
        ))}
      </div>
      <span className="sr-only">{t(EvalSystemHealthI18nKey.RunTrendsTrendSummary, { rates })}</span>
    </div>
  );
};

export default RunTrendBarsCell;
