'use client';

import { FC } from 'react';

import { ElementSize, Select } from '@epam/ai-dial-ui-kit';

import { useCompareOptions } from '@/src/components/Analytics/Usage/Controls/use-compare-options';
import { ComparePeriod } from '@/src/components/Analytics/Usage/models';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  value: ComparePeriod;
  onChange: (compare: ComparePeriod) => void;
}

// Sized to its longest option: the 2.0 `Select` cannot shrink-wrap its own text (see `UsageControls`).
const COMPARE_SELECT_WIDTH = 'w-[200px]';

/** The window a dashboard compares against; shared by the usage dashboard and custom dashboards. */
const CompareSelect: FC<Props> = ({ value, onChange }) => {
  const t = useI18n();
  const options = useCompareOptions();

  return (
    <Select
      size={ElementSize.Small}
      className={`!w-auto ${COMPARE_SELECT_WIDTH}`}
      options={options}
      value={value}
      prefix={t(AnalyticsUsageI18nKey.CompareLabel)}
      ariaLabel={t(AnalyticsUsageI18nKey.CompareLabel)}
      onChange={(next) => onChange(next as ComparePeriod)}
    />
  );
};

export default CompareSelect;
