import { DialSelect, SelectSize, SelectVariant } from '@epam/ai-dial-ui-kit';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { Dispatch, FC, SetStateAction, useCallback, useRef, useState } from 'react';

import RangePicker from '@/src/components/Common/RangePicker/RangePicker';
import { timePeriodOptionsConfig } from '@/src/constants/global-time-filter';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { TimeRange } from '@/src/models/time-range';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';
import { formatDate } from './utils';

interface Props {
  timePeriod: string;
  onTimePeriodChange: (value: string) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange, isCustom?: boolean) => void;
  isCustomRange?: boolean;
  setIsCustomRange?: Dispatch<SetStateAction<boolean>>;
  timePeriodOptions?: typeof timePeriodOptionsConfig;
}

const TimeFilter: FC<Props> = ({
  timePeriod,
  onTimePeriodChange,
  timeRange,
  onTimeRangeChange,
  isCustomRange = false,
  setIsCustomRange,
  timePeriodOptions,
}) => {
  const options = timePeriodOptions ?? timePeriodOptionsConfig;
  const t = useI18n();
  const dismissRef = useRef<{ dismiss: () => void }>(null);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [value, setValue] = useState<string>(
    isCustomRange ? `${formatDate(timeRange.startDate)} - ${formatDate(timeRange.endDate)}` : timePeriod,
  );

  const onRangeChange = useCallback(
    (range: TimeRange) => {
      const { startDate, endDate } = range;
      if (startDate && endDate) {
        onTimeRangeChange(range, true);
        const value = `${formatDate(startDate)} - ${formatDate(endDate)}`;
        dismissRef.current?.dismiss();
        setValue(value);
        setIsCustomRange?.(true);
      }
    },
    [onTimeRangeChange, setIsCustomRange],
  );

  const onItemSelect = useCallback(
    (value: string) => {
      setValue(value);
      onTimePeriodChange(value);
      onTimeRangeChange(getTimeRangeById(value), false);
      setIsCustomRange?.(false);
    },
    [onTimePeriodChange, onTimeRangeChange, setIsCustomRange],
  );

  const onClick = useCallback(() => {
    setShowCustomRange((prev) => {
      return !prev;
    });
  }, [setShowCustomRange]);

  return (
    <DialSelect
      size={SelectSize.Sm}
      variant={SelectVariant.Secondary}
      prefix={t(TelemetryI18nKey.TimePeriod)}
      options={options}
      value={value}
      dismissRef={dismissRef}
      customSelectedValue={
        options.some((item) => item.value === value) ? void 0 : `${t(TelemetryI18nKey.Custom)}: ${value}`
      }
      header={
        <div className="flex flex-col w-full">
          <button className="flex items-center p-3 border-b border-b-secondary" onClick={onClick} aria-label="button">
            <i className="mr-3">
              {showCustomRange ? (
                <IconChevronDown {...BASE_BUTTON_ICON_PROPS} />
              ) : (
                <IconChevronRight {...BASE_BUTTON_ICON_PROPS} />
              )}
            </i>
            <p className="small text-primary">{t(TelemetryI18nKey.CustomTimeRage)}</p>
          </button>
          {showCustomRange && <RangePicker onChange={onRangeChange} timeRange={timeRange} />}
        </div>
      }
      onChange={(v) => onItemSelect(v as string)}
    />
  );
};

export default TimeFilter;
