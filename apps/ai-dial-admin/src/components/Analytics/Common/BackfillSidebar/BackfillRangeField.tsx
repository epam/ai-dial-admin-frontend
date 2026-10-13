'use client';

import { FC, useCallback } from 'react';

import { Calendar, CalendarMode, CalendarValue } from '@epam/ai-dial-ui-kit';

import { BackfillI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { BackfillRangeIssue } from '@/src/models/analytics/backfill-ui';
import { BackfillRange } from '@/src/components/Analytics/Common/BackfillSidebar/models';
import { formatCalendarDay, getSpanInDays, parseCalendarDay } from '@/src/utils/analytics/backfill';

interface Props {
  value: BackfillRange;
  onChange: (range: BackfillRange) => void;
  today: string;
  /** Why the range cannot be sent, or null. A missing date is not reported here: an empty form is not an error. */
  issue: BackfillRangeIssue | null;
  isDisabled?: boolean;
  maxDays?: number;
}

const ISSUE_MESSAGE: Partial<Record<BackfillRangeIssue, BackfillI18nKey>> = {
  [BackfillRangeIssue.Inverted]: BackfillI18nKey.RangeIssueInverted,
  [BackfillRangeIssue.InFuture]: BackfillI18nKey.RangeIssueInFuture,
  [BackfillRangeIssue.TooLong]: BackfillI18nKey.RangeIssueTooLong,
};

const asDay = (value: CalendarValue): string => (value instanceof Date ? formatCalendarDay(value) : '');

/**
 * Two inclusive UTC dates and a line saying how many days they cover.
 *
 * Not the shared range calendar: that one stops at the reader's local today, so a reader east of Greenwich can pick
 * a date the service still counts as tomorrow. The last selectable day here is the UTC one.
 */
const BackfillRangeField: FC<Props> = ({ value, onChange, today, issue, isDisabled, maxDays }) => {
  const t = useI18n();

  const onFromChange = useCallback(
    (next: CalendarValue) => onChange({ ...value, from: asDay(next) }),
    [onChange, value],
  );
  const onToChange = useCallback((next: CalendarValue) => onChange({ ...value, to: asDay(next) }), [onChange, value]);

  const hasBothDays = Boolean(parseCalendarDay(value.from) && parseCalendarDay(value.to));
  const days = hasBothDays ? getSpanInDays(value.from, value.to) : null;
  const message = issue ? ISSUE_MESSAGE[issue] : undefined;
  const isInvalid = message != null;
  const maxDate = parseCalendarDay(today) ?? undefined;

  return (
    <div className="flex flex-col gap-y-3">
      <div className="grid grid-cols-2 gap-x-3">
        <Calendar
          mode={CalendarMode.Date}
          value={parseCalendarDay(value.from)}
          onChange={onFromChange}
          maxDate={maxDate}
          disabled={isDisabled}
          invalid={isInvalid}
          labelProps={{ label: t(BackfillI18nKey.FieldFrom) }}
        />
        <Calendar
          mode={CalendarMode.Date}
          value={parseCalendarDay(value.to)}
          onChange={onToChange}
          maxDate={maxDate}
          disabled={isDisabled}
          invalid={isInvalid}
          labelProps={{ label: t(BackfillI18nKey.FieldTo) }}
        />
      </div>
      <p
        className={isInvalid ? 'text-error dial-tiny' : 'text-secondary dial-tiny'}
        role={isInvalid ? 'alert' : undefined}
      >
        {message != null && t(message, { days: maxDays ?? '' })}
        {message == null && days === 1 && t(BackfillI18nKey.RangeSummaryOne)}
        {message == null && days != null && days > 1 && t(BackfillI18nKey.RangeSummary, { days })}
      </p>
    </div>
  );
};

export default BackfillRangeField;
