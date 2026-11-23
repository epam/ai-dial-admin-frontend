'use client';

import { GhostButton, Search } from '@epam/ai-dial-ui-kit';
import { IconColumns2 } from '@tabler/icons-react';
import { FC } from 'react';

import FeedbackFilterControl from '@/src/components/Analytics/SessionsTrace/Toolbar/FeedbackFilterControl';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ButtonsI18nKey, SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { FeedbackFilter } from '@/src/models/analytics/sessions-trace';
import { TimeRange } from '@/src/models/time-range';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  timePeriod: string;
  onTimePeriodChange: (value: string) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange, isCustom?: boolean) => void;
  feedback: FeedbackFilter;
  onFeedbackChange: (value: FeedbackFilter) => void;
  hasFeedbackFilter: boolean;
  onToggleColumnsPanel: () => void;
}

const SessionsToolbar: FC<Props> = ({
  search,
  onSearchChange,
  timePeriod,
  onTimePeriodChange,
  timeRange,
  onTimeRangeChange,
  feedback,
  onFeedbackChange,
  hasFeedbackFilter,
  onToggleColumnsPanel,
}) => {
  const t = useI18n();

  return (
    <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-3">
      <div className="min-w-[280px] max-w-[420px] flex-1">
        <Search
          id="sessions-search"
          value={search}
          onChange={(value) => onSearchChange(value ?? '')}
          placeholder={t(SessionsTraceI18nKey.SearchPlaceholder)}
        />
      </div>
      <TimeFilter
        timePeriod={timePeriod}
        onTimePeriodChange={onTimePeriodChange}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
      />
      <div className="ml-auto flex flex-wrap items-center gap-4">
        {hasFeedbackFilter && <FeedbackFilterControl feedback={feedback} onFeedbackChange={onFeedbackChange} />}
        <GhostButton
          label={t(ButtonsI18nKey.Columns)}
          iconBefore={<IconColumns2 {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onToggleColumnsPanel}
        />
      </div>
    </div>
  );
};

export default SessionsToolbar;
