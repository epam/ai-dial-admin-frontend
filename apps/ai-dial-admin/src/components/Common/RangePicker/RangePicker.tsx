import { FC, useCallback, useState } from 'react';
import { DialPrimaryButton } from '@epam/ai-dial-ui-kit';

import DatePicker from '@/src/components/Common/DatePicker/DatePicker';
import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TimeRange } from '@/src/models/time-range';
import { topOffset } from './constants';

interface Props {
  timeRange: TimeRange | null;
  onChange: (range: TimeRange) => void;
}

const RangePicker: FC<Props> = ({ onChange, timeRange }) => {
  const t = useI18n();
  const [startDate, setStartDate] = useState<Date | null>(timeRange?.startDate || null);
  const [endDate, setEndDate] = useState<Date | null>(timeRange?.endDate || null);

  const onClick = useCallback(() => {
    if (startDate && endDate) {
      onChange({ startDate, endDate });
    }
  }, [onChange, startDate, endDate]);

  const onStartDateChange = useCallback((startDate: Date | null) => {
    if (startDate) {
      // reset hours, minutes, seconds, milliseconds to 0
      startDate.setHours(0, 0, 0, 0);
      setStartDate(startDate);
    }
  }, []);

  const onEndDateChange = useCallback((endDate: Date | null) => {
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
      setEndDate(endDate);
    }
  }, []);

  return (
    <div className="flex flex-col w-full p-3">
      <p className="tiny text-secondary mb-2 cursor-default">{t(BasicI18nKey.From)}</p>
      <DatePicker
        id="start-date"
        className="dial-input cursor-pointer"
        date={startDate}
        setDate={onStartDateChange}
        startDate={startDate}
        endDate={endDate}
        maxDate={endDate === null ? void 0 : endDate}
        popperPlacement="bottom"
        popperModifiers={[
          {
            name: 'flip',
            fn: (state) => {
              const yPosition = state.rects.reference.y + state.rects.reference.height + topOffset;
              return { ...state, y: yPosition };
            },
          },
        ]}
      />
      <p className="tiny text-secondary mb-2 cursor-default">{t(BasicI18nKey.To)}</p>
      <DatePicker
        id="end-date"
        className="dial-input cursor-pointer"
        date={endDate}
        setDate={onEndDateChange}
        startDate={startDate}
        endDate={endDate}
        minDate={startDate === null ? void 0 : startDate} // minDate: Date | undefined
        popperPlacement="bottom"
        popperModifiers={[
          {
            name: 'flip',
            fn: (state) => {
              const yPosition = state.rects.reference.y + state.rects.reference.height + topOffset;
              return { ...state, y: yPosition };
            },
          },
        ]}
      />
      <DialPrimaryButton label={t(ButtonsI18nKey.Apply)} onClick={onClick} className="w-max" />
    </div>
  );
};

export default RangePicker;
