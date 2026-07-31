'use client';

import { DialSearch } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import FeedbackFilterControl from '@/src/components/Analytics/ConversationsTrace/Toolbar/FeedbackFilterControl';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import { USE_CONVERSATION_SUMMARY_ENRICHMENT } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { FeedbackFilter } from '@/src/models/analytics/conversations-trace';
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
}

const ConversationsToolbar: FC<Props> = ({
  search,
  onSearchChange,
  timePeriod,
  onTimePeriodChange,
  timeRange,
  onTimeRangeChange,
  feedback,
  onFeedbackChange,
}) => {
  const t = useI18n();

  return (
    <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-3">
      <div className="min-w-[280px] max-w-[420px] flex-1">
        <DialSearch
          id="conversations-search"
          value={search}
          onChange={onSearchChange}
          placeholder={t(
            USE_CONVERSATION_SUMMARY_ENRICHMENT
              ? ConversationsTraceI18nKey.SearchPlaceholderWithTitles
              : ConversationsTraceI18nKey.SearchPlaceholder,
          )}
        />
      </div>
      <TimeFilter
        timePeriod={timePeriod}
        onTimePeriodChange={onTimePeriodChange}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
      />
      <div className="ml-auto flex flex-wrap items-center gap-4">
        <FeedbackFilterControl feedback={feedback} onFeedbackChange={onFeedbackChange} />
      </div>
    </div>
  );
};

export default ConversationsToolbar;
