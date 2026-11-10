'use client';

import { FC } from 'react';

import PassRateBar from '@/src/components/Common/PassRateBar/PassRateBar';
import { formatPassRatePercent } from '@/src/components/Common/PassRateBar/utils';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

import { NO_DATA_VALUE } from './constants';
import { CardValueSection } from './models';
import { formatThreshold } from './utils';

interface Props {
  /** 0–1 fraction, null when the run has no test cases. */
  rate: number | null;
  /** Threshold line is shown only when this is set. */
  threshold?: number | null;
  /** Accessible name of the bar — the card title. */
  label: string;
  section?: CardValueSection;
}

const PassRateValue: FC<Props> = ({ rate, threshold, label, section = CardValueSection.Full }) => {
  const t = useI18n();

  if (rate == null) {
    return section === CardValueSection.Footer ? null : (
      <span className="dial-display2-text text-secondary">{NO_DATA_VALUE}</span>
    );
  }

  const figure = (
    <div className="flex flex-col gap-2">
      <span className="dial-display2-text text-primary">{formatPassRatePercent(rate)}</span>
      <PassRateBar rate={rate} label={label} />
    </div>
  );
  const footer = threshold != null && (
    <span className="flex gap-1 dial-small-text">
      <span className="text-secondary">{t(TestSuitesI18nKey.TrendsThresholdLabel)}</span>
      <span className="text-primary">{formatThreshold(threshold)}</span>
    </span>
  );

  if (section === CardValueSection.Figure) {
    return figure;
  }

  if (section === CardValueSection.Footer) {
    return footer || null;
  }

  return (
    <div className="flex flex-col gap-2">
      {figure}
      {footer}
    </div>
  );
};

export default PassRateValue;
