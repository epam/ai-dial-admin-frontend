'use client';

import { ICellRendererParams } from 'ag-grid-community';

import PassRateBar from '@/src/components/Common/PassRateBar/PassRateBar';
import { formatPassRatePercent } from '@/src/components/Common/PassRateBar/utils';
import { RunTrendRow } from '@/src/components/EvalSystemHealth/models';
import { NO_DATA_VALUE } from '@/src/components/Runs/Summary/Cards/constants';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const RunTrendLatestCell = ({ data }: ICellRendererParams<RunTrendRow>) => {
  const t = useI18n();
  const rate = data?.latestRate;

  if (rate == null) {
    return <span className="flex size-full items-center text-secondary">{NO_DATA_VALUE}</span>;
  }

  return (
    <div className="flex size-full flex-col justify-center gap-1">
      <span className="dial-small-text text-primary">{formatPassRatePercent(rate)}</span>
      <PassRateBar rate={rate} label={`${data?.suiteName}: ${t(EvalSystemHealthI18nKey.RunTrendsColumnLatest)}`} />
    </div>
  );
};

export default RunTrendLatestCell;
