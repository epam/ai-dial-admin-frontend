import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { FC, useCallback, useState } from 'react';
import ReactDatePicker from 'react-datepicker';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TimeRange } from '@/src/models/time-range';

import { RangeFsmState, differenceInCalendarDays, hydrate, reduce, toCommit, toDisplayRange } from './range-fsm';
// @ts-expect-error
import 'react-datepicker/dist/react-datepicker.css';

interface Props {
  value: TimeRange | null;
  onChange: (range: TimeRange | null) => void;
  maxDays?: number;
}

const monthLabel = (date: Date) => date.toLocaleString(undefined, { month: 'long', year: 'numeric' });

const RangePicker: FC<Props> = ({ value, onChange, maxDays }) => {
  const t = useI18n();
  const [state, setState] = useState<RangeFsmState>(() => hydrate(value));

  const handleDayClick = useCallback(
    (day: Date | null) => {
      if (!day) return;
      const next = reduce(state, day, maxDays);
      setState(next);
      onChange(toCommit(next));
    },
    [state, maxDays, onChange],
  );

  const display = toDisplayRange(state);
  const selected = display?.start ?? null;
  const startDate = display?.start ?? null;
  const endDate = display?.end ?? null;

  const dayClassName = useCallback(
    (date: Date): string => {
      if (!maxDays || state.kind !== 'single') return '';
      const delta = differenceInCalendarDays(date, state.date);
      return delta > maxDays - 1 ? 'dial-range-picker__day--out-of-reach' : '';
    },
    [state, maxDays],
  );

  return (
    <div className="dial-range-calendar flex flex-col gap-3 p-3">
      {maxDays && (
        <div className="self-start px-2 py-0.5 rounded border border-warning text-primary tiny" role="status">
          {t(TelemetryI18nKey.MaxRangeDays, { days: maxDays })}
        </div>
      )}
      <ReactDatePicker
        inline
        selectsRange
        selected={selected}
        startDate={startDate}
        endDate={endDate}
        maxDate={new Date()}
        onChange={() => {}}
        onSelect={handleDayClick}
        calendarStartDay={1}
        shouldCloseOnSelect={false}
        disabledKeyboardNavigation
        dayClassName={dayClassName}
        renderCustomHeader={({ monthDate, decreaseMonth, increaseMonth }) => {
          const now = new Date();
          const isCurrentMonth =
            monthDate.getMonth() === now.getMonth() && monthDate.getFullYear() === now.getFullYear();
          return (
            <div className="flex items-center justify-between px-2">
              <button type="button" onClick={decreaseMonth} aria-label="previous-month">
                <IconChevronLeft {...BASE_BUTTON_ICON_PROPS} />
              </button>
              <span className="text-primary">{monthLabel(monthDate)}</span>
              {isCurrentMonth ? (
                <span className="w-6" />
              ) : (
                <button type="button" onClick={increaseMonth} aria-label="next-month">
                  <IconChevronRight {...BASE_BUTTON_ICON_PROPS} />
                </button>
              )}
            </div>
          );
        }}
      />
    </div>
  );
};

export default RangePicker;
