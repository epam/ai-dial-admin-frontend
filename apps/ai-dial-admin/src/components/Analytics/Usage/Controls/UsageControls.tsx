'use client';

import { FC, ReactNode, useMemo } from 'react';

import { IconRefresh } from '@tabler/icons-react';
import { GhostButton, ElementSize, Select } from '@epam/ai-dial-ui-kit';

import CompareSelect from '@/src/components/Analytics/Usage/Controls/CompareSelect';
import { ComparePeriod, UsageView } from '@/src/components/Analytics/Usage/models';
import { TimeFilterAppearance } from '@/src/components/Common/TimeFilter/models';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import { AnalyticsUsageI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { TimeRange } from '@/src/models/time-range';
import { VIEW_LABEL_KEY } from '@/src/components/Analytics/Usage/utils/labels';

const ALL_VIEWS: UsageView[] = [UsageView.Llm, UsageView.Mcp, UsageView.Routes];

interface Props {
  // Rendered ahead of the controls: the dashboard switcher, while custom dashboards are on.
  leadingControl?: ReactNode;
  view: UsageView;
  onViewChange: (view: UsageView) => void;
  /** The views `View by` offers, in order; an entity offers only the ones it has traffic of. */
  views?: UsageView[];
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
 * intrinsic width — which is why both selects rendered the same ~200px whatever they said. Each one
 * is sized to its longest option instead, so the controls make one row.
 */
const VIEW_SELECT_WIDTH = 'w-[124px]';

const UsageControls: FC<Props> = ({
  leadingControl,
  view,
  views = ALL_VIEWS,
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
    () => views.map((option) => ({ value: option, label: t(VIEW_LABEL_KEY[option]) })),
    [views, t],
  );

  return (
    <div className="flex flex-row flex-wrap items-center gap-x-3 gap-y-2">
      {leadingControl}
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
      <CompareSelect value={compare} onChange={onCompareChange} />
      <div className="grow" />
      <GhostButton
        iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
        label={t(ButtonsI18nKey.Refresh)}
        disabled={isRefreshing}
        onClick={onRefresh}
      />
    </div>
  );
};

export default UsageControls;
