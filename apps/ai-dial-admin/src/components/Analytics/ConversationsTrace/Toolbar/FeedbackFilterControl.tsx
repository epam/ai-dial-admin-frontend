'use client';

import { DialSegmentedControl, SegmentedControlOption } from '@epam/ai-dial-ui-kit';
import { IconThumbDown, IconThumbUp } from '@tabler/icons-react';
import { FC, useMemo } from 'react';

import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { FeedbackFilter } from '@/src/models/analytics/conversations-trace';

interface Props {
  feedback: FeedbackFilter;
  onFeedbackChange: (value: FeedbackFilter) => void;
}

const FeedbackFilterControl: FC<Props> = ({ feedback, onFeedbackChange }) => {
  const t = useI18n();

  const options = useMemo<SegmentedControlOption<FeedbackFilter>[]>(
    () => [
      { value: FeedbackFilter.All, label: t(ConversationsTraceI18nKey.FeedbackAll) },
      {
        value: FeedbackFilter.Positive,
        icon: <IconThumbUp {...BASE_BUTTON_ICON_PROPS} />,
        label: <span className="sr-only">{t(ConversationsTraceI18nKey.FeedbackPositive)}</span>,
      },
      {
        value: FeedbackFilter.Negative,
        icon: <IconThumbDown {...BASE_BUTTON_ICON_PROPS} />,
        label: <span className="sr-only">{t(ConversationsTraceI18nKey.FeedbackNegative)}</span>,
      },
      { value: FeedbackFilter.Rated, label: t(ConversationsTraceI18nKey.FeedbackRated) },
    ],
    [t],
  );

  return (
    <div className="flex items-center gap-2">
      <span className="dial-small-text text-secondary whitespace-nowrap uppercase">
        {t(ConversationsTraceI18nKey.Feedback)}
      </span>
      <DialSegmentedControl
        options={options}
        value={feedback}
        onChange={onFeedbackChange}
        ariaLabel={t(ConversationsTraceI18nKey.Feedback)}
      />
    </div>
  );
};

export default FeedbackFilterControl;
