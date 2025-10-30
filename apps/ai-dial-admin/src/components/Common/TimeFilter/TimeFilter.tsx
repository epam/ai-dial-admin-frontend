import { FC, useCallback, useRef, useState } from 'react';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';

import { timePeriodOptionsConfig } from '@/src/constants/global-time-filter';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import DropdownMenuItem from '@/src/components/Common/Dropdown/DropdownItem';
import Dropdown from '@/src/components/Common/Dropdown/Dropdown';
import { useI18n } from '@/src/locales/client';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import RangePicker from '@/src/components/Common/RangePicker/RangePicker';
import { TimeRange } from '@/src/models/time-range';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';
import SecondaryDropdown from '../SecondaryDropdown/SecondaryDropdown';

interface Props {
  timePeriod: string;
  onTimePeriodChange: (value: string) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange) => void;
}

const TimeFilter: FC<Props> = ({ timePeriod, onTimePeriodChange, timeRange, onTimeRangeChange }) => {
  const t = useI18n();
  const dismissRef = useRef<{ dismiss: () => void }>(null);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [value, setValue] = useState<string>(timePeriod); //TODO: start value

  const onRangeChange = useCallback(
    (range: TimeRange) => {
      const { startDate, endDate } = range;
      if (startDate && endDate) {
        onTimeRangeChange(range);
        const formatDate = (date: Date) => {
          const day = ('0' + date.getDate()).slice(-2);
          const month = ('0' + (date.getMonth() + 1)).slice(-2);
          const year = date.getFullYear();
          return `${month}-${day}-${year}`;
        };
        const value = `${formatDate(startDate)} - ${formatDate(endDate)}`;
        dismissRef.current?.dismiss();
        setValue(value);
      }
    },
    [onTimeRangeChange],
  );

  const onItemSelect = useCallback(
    (value: string) => {
      setValue(value);
      onTimePeriodChange(value);
      onTimeRangeChange(getTimeRangeById(value));
    },
    [onTimePeriodChange, onTimeRangeChange],
  );

  const onClick = useCallback(() => {
    setShowCustomRange((prev) => {
      return !prev;
    });
  }, [setShowCustomRange]);

  return (
    <SecondaryDropdown
      prefix={t(TelemetryI18nKey.TimePeriod)}
      items={timePeriodOptionsConfig}
      onChange={onItemSelect}
      selectedValue=""
    />

    //     selectedValue={
    //       timePeriodOptionsConfig.find((item) => item.id === value) || {
    //         id: 'Custom',
    //         name: `${value}`,
    //       }
    //     }
    //
    // {showCustomRange && <RangePicker onChange={onRangeChange} timeRange={timeRange} />}
  );
};

export default TimeFilter;
