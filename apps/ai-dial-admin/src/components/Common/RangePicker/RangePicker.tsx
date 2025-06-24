import { FC, useCallback, useState } from 'react';
import DatePicker from '@/src/components/Common/DatePicker/DatePicker';
import Button from '@/src/components/Common/Button/Button';
import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TimeRange } from '@/src/models/time-range';

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
      startDate.setHours(0);
      startDate.setMinutes(0);
      startDate.setSeconds(0);
      startDate.setMilliseconds(0);
      setStartDate(startDate);
    }
  }, []);

  const onEndDateChange = useCallback((endDate: Date | null) => {
    if (endDate) {
      endDate.setHours(12);
      endDate.setMinutes(59);
      endDate.setSeconds(59);
      endDate.setMilliseconds(0);
      setEndDate(endDate);
    }
  }, []);

  return (
    <div className="flex flex-col w-full p-3">
      <DatePicker
        id="start-date"
        label={t(BasicI18nKey.From)}
        date={startDate}
        setDate={onStartDateChange}
        startDate={startDate}
        endDate={endDate}
      />
      <DatePicker
        id="end-date"
        label={t(BasicI18nKey.To)}
        date={endDate}
        setDate={onEndDateChange}
        startDate={startDate}
        endDate={endDate}
        minDate={startDate === null ? void 0 : startDate} // minDate: Date | undefined
      />
      <Button title={t(ButtonsI18nKey.Apply)} onClick={onClick} cssClass="primary w-max" />
    </div>
  );
};

export default RangePicker;
