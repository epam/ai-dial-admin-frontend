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
    <div>
      <Dropdown
        selectedClassName="flex items-center my-[5px] mr-2 px-1.5 py-1 small text-primary rounded bg-layer-3 cursor-pointer"
        className="flex items-center"
        selectedValue={
          timePeriodOptionsConfig.find((item) => item.id === value) || {
            id: 'Custom',
            name: `${value}`,
          }
        }
        prefix={t(TelemetryI18nKey.TimePeriod)}
        listClassName={'w-[276px]'}
        dismissRef={dismissRef}
      >
        <div className="flex flex-col max-h-[382px] overflow-scroll">
          <div className="flex flex-col w-full">
            <button className="flex items-center p-3 border-b border-b-secondary" onClick={onClick} aria-label="button">
              <i className="mr-3">
                {showCustomRange ? <IconChevronDown {...BASE_ICON_PROPS} /> : <IconChevronRight {...BASE_ICON_PROPS} />}
              </i>
              <p className="small text-primary">{t(TelemetryI18nKey.CustomTimeRage)}</p>
            </button>
            {showCustomRange && <RangePicker onChange={onRangeChange} timeRange={timeRange} />}
          </div>
          {timePeriodOptionsConfig.map((item, i) => (
            <DropdownMenuItem key={i} dropdownItem={item} onClick={() => onItemSelect(item.id)} />
          ))}
        </div>
      </Dropdown>
    </div>
  );
};

export default TimeFilter;
