import { FC } from 'react';

import MetricCardShell from '@/src/components/Common/MetricCard/MetricCardShell';
import { useI18n } from '@/src/locales/client';
import { formatNumberWithExponent } from '@/src/utils/formatting/number-formatting';

interface Props {
  title: string;
  primary: number | null;
  secondary: number | null;
  primaryLabel: string;
  secondaryLabel: string;
  unit?: string;
  loading: boolean;
  emptyReason?: string;
}

const DualValueCard: FC<Props> = ({
  title,
  primary,
  secondary,
  primaryLabel,
  secondaryLabel,
  unit,
  loading,
  emptyReason,
}) => {
  const t = useI18n();
  const isEmpty = primary === null && secondary === null;

  return (
    <MetricCardShell title={title} loading={loading} isEmpty={isEmpty} emptyReason={emptyReason}>
      <div className="flex w-full items-center justify-around gap-2">
        {[
          { label: primaryLabel, value: primary },
          { label: secondaryLabel, value: secondary },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center">
            <span className="text-accent-primary font-semibold md:text-4xl text-2xl nowrap">
              {value === null ? '—' : formatNumberWithExponent(value)}
            </span>
            <span className="text-secondary font-extralight text-xs">
              {t(label)}
              {unit ? ` ${unit}` : ''}
            </span>
          </div>
        ))}
      </div>
    </MetricCardShell>
  );
};

export default DualValueCard;
