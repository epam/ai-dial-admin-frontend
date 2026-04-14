import {
  DialPrimaryButton,
  DialNeutralButton,
  DialSelect,
  SelectSize,
  SelectVariant,
  ElementSize,
} from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useRef, useState } from 'react';

import RangePicker from '@/src/components/Common/RangePicker/RangePicker';
import { TimePeriodOption, getTimePeriodOptionsByMaxDays } from '@/src/constants/global-time-filter';
import { ButtonsI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { CalendarAlignment, TimeRange } from '@/src/models/time-range';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';
import { formatDate } from './utils';

type DraftMode = { mode: 'preset'; presetId: string } | { mode: 'custom'; range: TimeRange | null };

const CUSTOM_VALUE_SENTINEL = '__custom__';

interface Props {
  timePeriod: string;
  onTimePeriodChange: (value: string) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange, isCustom?: boolean) => void;
  timePeriodOptions?: TimePeriodOption[];
  maxRangeDays?: number;
  calendarAlignment?: CalendarAlignment;
}

const TimeFilter: FC<Props> = ({
  timePeriod,
  onTimePeriodChange,
  timeRange,
  onTimeRangeChange,
  timePeriodOptions,
  maxRangeDays,
  calendarAlignment = CalendarAlignment.Right,
}) => {
  const t = useI18n();
  const options = timePeriodOptions ?? getTimePeriodOptionsByMaxDays(maxRangeDays);
  const dismissRef = useRef<{ dismiss: () => void }>(null);
  const [isCustom, setIsCustom] = useState(false);

  const [draft, setDraft] = useState<DraftMode>({ mode: 'preset', presetId: timePeriod });

  const resetDraft = useCallback(() => {
    setDraft(isCustom ? { mode: 'custom', range: timeRange } : { mode: 'preset', presetId: timePeriod });
  }, [isCustom, timeRange, timePeriod]);

  const handlePresetSelect = useCallback(
    (value: string | string[]) => {
      const presetId = value as string;
      onTimePeriodChange(presetId);
      onTimeRangeChange(getTimeRangeById(presetId), false);
      setIsCustom(false);
      setDraft({ mode: 'preset', presetId });
    },
    [onTimePeriodChange, onTimeRangeChange],
  );

  const handleCustomClick = useCallback(() => {
    setDraft({ mode: 'custom', range: isCustom ? timeRange : null });
  }, [isCustom, timeRange]);

  const handleRangeChange = useCallback((range: TimeRange | null) => {
    setDraft({ mode: 'custom', range });
  }, []);

  const handleApply = useCallback(() => {
    if (draft.mode !== 'custom' || !draft.range) return;
    onTimeRangeChange(draft.range, true);
    setIsCustom(true);
    dismissRef.current?.dismiss();
  }, [draft, onTimeRangeChange]);

  const handleCancel = useCallback(() => {
    resetDraft();
    dismissRef.current?.dismiss();
  }, [resetDraft]);

  const showCalendar = draft.mode === 'custom';
  const canApply = draft.mode === 'custom' && draft.range !== null;

  const footer = (
    <div className="relative border-t border-secondary">
      <button
        type="button"
        onClick={handleCustomClick}
        className={`w-full text-left px-3 py-2 small hover:bg-layer-3 ${showCalendar ? 'bg-layer-3' : ''}`}
      >
        <span className="text-primary">{t(TelemetryI18nKey.Custom)}</span>
        {draft.mode === 'custom' && draft.range && (
          <span className="text-secondary ml-2">
            {formatDate(draft.range.startDate)} - {formatDate(draft.range.endDate)}
          </span>
        )}
      </button>
      {showCalendar && (
        <div
          className={`absolute bottom-0 flex flex-col bg-layer-0 border border-secondary shadow-lg ${
            calendarAlignment === CalendarAlignment.Left ? 'right-full rounded-l' : 'left-full rounded-r'
          }`}
        >
          <RangePicker value={draft.range} onChange={handleRangeChange} maxDays={maxRangeDays} />
          <div className="flex justify-end gap-2 px-3 pb-3">
            <DialNeutralButton size={ElementSize.Small} label={t(ButtonsI18nKey.Cancel)} onClick={handleCancel} />
            <DialPrimaryButton
              size={ElementSize.Small}
              label={t(ButtonsI18nKey.Apply)}
              onClick={handleApply}
              disabled={!canApply}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <DialSelect
      size={SelectSize.Sm}
      variant={SelectVariant.Secondary}
      prefix={t(TelemetryI18nKey.TimePeriod)}
      options={options}
      value={showCalendar || isCustom ? CUSTOM_VALUE_SENTINEL : timePeriod}
      customSelectedValue={
        showCalendar
          ? draft.range
            ? `${t(TelemetryI18nKey.Custom)}: ${formatDate(draft.range.startDate)} - ${formatDate(draft.range.endDate)}`
            : t(TelemetryI18nKey.Custom)
          : isCustom
            ? `${t(TelemetryI18nKey.Custom)}: ${formatDate(timeRange.startDate)} - ${formatDate(timeRange.endDate)}`
            : options.find((o) => o.value === timePeriod)?.label
      }
      dismissRef={dismissRef}
      listClassName="overflow-visible min-w-[200px]"
      onOpenChange={(open) => {
        if (!open) resetDraft();
      }}
      onChange={handlePresetSelect}
      footer={footer}
    />
  );
};

export default TimeFilter;
