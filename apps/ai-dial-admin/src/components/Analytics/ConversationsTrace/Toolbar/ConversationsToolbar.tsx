'use client';

import { DialGhostButton, DialSearch } from '@epam/ai-dial-ui-kit';
import { IconAlertTriangle, IconColumns2 } from '@tabler/icons-react';
import { FC } from 'react';

import FeedbackFilterControl from '@/src/components/Analytics/ConversationsTrace/Toolbar/FeedbackFilterControl';
import TimeFilter from '@/src/components/Common/TimeFilter/TimeFilter';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ButtonsI18nKey, ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { FeedbackFilter } from '@/src/models/analytics/conversations-trace';
import { TimeRange } from '@/src/models/time-range';

const NOTICE_ICON_SIZE = 14;

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  timePeriod: string;
  onTimePeriodChange: (value: string) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange, isCustom?: boolean) => void;
  feedback: FeedbackFilter;
  onFeedbackChange: (value: FeedbackFilter) => void;
  isFeedbackCapped: boolean;
  hasSchemaError?: boolean;
  onToggleColumnsPanel: () => void;
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
  isFeedbackCapped,
  hasSchemaError,
  onToggleColumnsPanel,
}) => {
  const t = useI18n();

  return (
    <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-3">
      <div className="min-w-[280px] max-w-[420px] flex-1">
        <DialSearch
          id="conversations-search"
          value={search}
          onChange={onSearchChange}
          placeholder={t(ConversationsTraceI18nKey.SearchPlaceholder)}
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
        <DialGhostButton
          label={t(ButtonsI18nKey.Columns)}
          iconBefore={<IconColumns2 {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onToggleColumnsPanel}
        />
      </div>
      {hasSchemaError && (
        <div className="flex w-full items-center gap-1.5 text-warning dial-tiny-text" role="status">
          <IconAlertTriangle size={NOTICE_ICON_SIZE} aria-hidden />
          <span>{t(ConversationsTraceI18nKey.SchemaUnavailableNotice)}</span>
        </div>
      )}
      {isFeedbackCapped && (
        <div className="flex w-full items-center gap-1.5 text-warning dial-tiny-text" role="status">
          <IconAlertTriangle size={NOTICE_ICON_SIZE} aria-hidden />
          <span>{t(ConversationsTraceI18nKey.FeedbackCappedNotice)}</span>
        </div>
      )}
    </div>
  );
};

export default ConversationsToolbar;
