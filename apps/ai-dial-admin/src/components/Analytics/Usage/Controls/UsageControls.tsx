'use client';

import { FC, useMemo } from 'react';

import { IconRefresh } from '@tabler/icons-react';
import { DialGhostButton, ElementSize, Select } from '@epam/ai-dial-ui-kit';

import { ComparePeriod, UsageView } from '@/src/components/Analytics/Usage/models';
import { TimeFilterAppearance } from '@/src/components/Common/TimeFilter/models';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import { AnalyticsUsageI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { TimeRange } from '@/src/models/time-range';

interface Props {
  view: UsageView;
  onViewChange: (view: UsageView) => void;
  compare: ComparePeriod;
  onCompareChange: (compare: ComparePeriod) => void;
  timePeriod: string;
  onTimePeriodChange: (period: string) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange, isCustom?: boolean) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

/*
 * Explicit widths, because the 2.0 `Select` cannot shrink-wrap its own text: its field is an
 * `<input>` at `width: 100%`, and an input with no `size` falls back to a twenty-character
 * intrinsic width — which is why both of these rendered the same ~200px whatever they said. These
 * are sized to their longest option instead, so the three controls make one row.
 */
const VIEW_SELECT_WIDTH = 'w-[124px]';
const COMPARE_SELECT_WIDTH = 'w-[200px]';

const UsageControls: FC<Props> = ({
  view,
  onViewChange,
  compare,
  onCompareChange,
  timePeriod,
  onTimePeriodChange,
  timeRange,
  onTimeRangeChange,
  isRefreshing,
  onRefresh,
}) => {
  const t = useI18n();

  const viewOptions = useMemo(
    () => [
      { value: UsageView.Llm, label: t(AnalyticsUsageI18nKey.ViewLlm) },
      { value: UsageView.Mcp, label: t(AnalyticsUsageI18nKey.ViewMcp) },
    ],
    [t],
  );

  const compareOptions = useMemo(
    () => [
      { value: ComparePeriod.Off, label: t(AnalyticsUsageI18nKey.CompareOff) },
      { value: ComparePeriod.PreviousPeriod, label: t(AnalyticsUsageI18nKey.ComparePreviousPeriod) },
      { value: ComparePeriod.PreviousMonth, label: t(AnalyticsUsageI18nKey.ComparePreviousMonth) },
      { value: ComparePeriod.PreviousYear, label: t(AnalyticsUsageI18nKey.ComparePreviousYear) },
    ],
    [t],
  );

  return (
    <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-2">
      <Select
        size={ElementSize.Small}
        className={`!w-auto ${VIEW_SELECT_WIDTH}`}
        options={viewOptions}
        value={view}
        prefix={t(AnalyticsUsageI18nKey.ViewByLabel)}
        ariaLabel={t(AnalyticsUsageI18nKey.ViewByLabel)}
        onChange={(next) => onViewChange(next as UsageView)}
      />
      <TimeFilter
        timePeriod={timePeriod}
        onTimePeriodChange={onTimePeriodChange}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
        appearance={TimeFilterAppearance.Modern}
      />
      <Select
        size={ElementSize.Small}
        className={`!w-auto ${COMPARE_SELECT_WIDTH}`}
        options={compareOptions}
        value={compare}
        prefix={t(AnalyticsUsageI18nKey.CompareLabel)}
        ariaLabel={t(AnalyticsUsageI18nKey.CompareLabel)}
        onChange={(next) => onCompareChange(next as ComparePeriod)}
      />
      <div className="grow" />
      <DialGhostButton
        iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
        label={t(ButtonsI18nKey.Refresh)}
        disabled={isRefreshing}
        onClick={onRefresh}
      />
    </div>
  );
};

export default UsageControls;
