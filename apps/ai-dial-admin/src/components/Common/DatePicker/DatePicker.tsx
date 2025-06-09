import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { FC, useCallback } from 'react';
import ReactDatePicker, { DatePickerProps } from 'react-datepicker';

import CalendarIcon from '@/public/images/icons/calendar.svg';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import 'react-datepicker/dist/react-datepicker.css';

type PickerProps = Omit<DatePickerProps, 'date'>;

interface Props extends PickerProps {
  id: string;
  label: string;
  date: Date | null;
  setDate: (date: Date | null) => void;
}

const DatePicker: FC<Props> = ({ id, label, date, setDate, ...props }) => {
  const customWeekdayFormat = (day: string) => {
    return day.slice(0, 3);
  };

  const onChange = useCallback(
    (date: Date) => {
      setDate(date);
    },
    [setDate],
  );

  return (
    <div className="mb-4">
      <label htmlFor={id}>
        <p className="tiny text-secondary mb-2">{label}</p>
      </label>
      <ReactDatePicker
        id={id}
        placeholderText="MM-DD-YYYY"
        dateFormat="MM-dd-yyyy"
        calendarStartDay={1}
        selected={date}
        onChange={onChange}
        previousMonthButtonLabel={<IconChevronLeft {...BASE_ICON_PROPS} />}
        nextMonthButtonLabel={<IconChevronRight {...BASE_ICON_PROPS} />}
        formatWeekDay={customWeekdayFormat}
        shouldCloseOnSelect={true}
        showIcon
        icon={
          <i>
            <CalendarIcon />
          </i>
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(props as any)}
      />
    </div>
  );
};

export default DatePicker;
