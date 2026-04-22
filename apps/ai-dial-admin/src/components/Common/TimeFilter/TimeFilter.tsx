import { DialDropdown, DialPrimaryButton, DialNeutralButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconChevronDown } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useState } from 'react';

import RangePicker from '@/src/components/Common/RangePicker/RangePicker';
import { MS_PER_DAY, TimePeriodOption, getTimePeriodOptionsByMaxMs } from '@/src/constants/global-time-filter';
import { ButtonsI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { TimeRange } from '@/src/models/time-range';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';
import { formatDate } from './utils';

type DraftMode = { mode: 'preset'; presetId: string } | { mode: 'custom'; range: TimeRange | null };

interface Props {
  timePeriod: string;
  onTimePeriodChange: (value: string) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange, isCustom?: boolean) => void;
  timePeriodOptions?: TimePeriodOption[];
  maxRangeMs?: number;
}

const TimeFilter: FC<Props> = ({
  timePeriod,
  onTimePeriodChange,
  timeRange,
  onTimeRangeChange,
  timePeriodOptions,
  maxRangeMs,
}) => {
  const t = useI18n();
  const options = getTimePeriodOptionsByMaxMs(timePeriodOptions, maxRangeMs);
  const maxDays = maxRangeMs != null ? Math.floor(maxRangeMs / MS_PER_DAY) : undefined;
  const [isOpen, setIsOpen] = useState(false);
  const [isCustom, setIsCustom] = useState(false);

  const [draft, setDraft] = useState<DraftMode>({ mode: 'preset', presetId: timePeriod });

  const resetDraft = useCallback(() => {
    setDraft(isCustom ? { mode: 'custom', range: timeRange } : { mode: 'preset', presetId: timePeriod });
  }, [isCustom, timeRange, timePeriod]);

  // Sync draft whenever committed state (props) changes
  useEffect(() => {
    setDraft(isCustom ? { mode: 'custom', range: timeRange } : { mode: 'preset', presetId: timePeriod });
  }, [isCustom, timeRange, timePeriod]);

  const close = useCallback(() => setIsOpen(false), []);

  const handlePresetClick = useCallback(
    (presetId: string) => {
      onTimePeriodChange(presetId);
      onTimeRangeChange(getTimeRangeById(presetId), false);
      setIsCustom(false);
      setDraft({ mode: 'preset', presetId });
      close();
    },
    [onTimePeriodChange, onTimeRangeChange, close],
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
    close();
  }, [draft, onTimeRangeChange, close]);

  const handleCancel = useCallback(() => {
    resetDraft();
    close();
  }, [resetDraft, close]);

  const showCalendar = draft.mode === 'custom';
  const canApply = draft.mode === 'custom' && draft.range !== null;

  // Trigger label
  const triggerLabel = isCustom
    ? `${formatDate(timeRange.startDate)} - ${formatDate(timeRange.endDate)}`
    : (options.find((o) => o.value === timePeriod)?.label ?? timePeriod);

  const presetList = (
    <ul className="flex flex-col py-1 min-w-[180px]">
      {options.map((opt) => (
        <li key={opt.value}>
          <button
            type="button"
            onClick={() => handlePresetClick(opt.value)}
            className={`w-full text-left px-3 py-2 small text-primary hover:bg-layer-3 whitespace-nowrap ${
              !isCustom && timePeriod === opt.value && !showCalendar ? 'bg-layer-3' : ''
            }`}
          >
            {opt.label}
          </button>
        </li>
      ))}
      <li className="border-t border-secondary">
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
      </li>
    </ul>
  );

  const calendarPanel = showCalendar && (
    <div className="flex flex-col border-l border-secondary">
      <RangePicker value={draft.range} onChange={handleRangeChange} maxDays={maxDays} />
      <div className="flex justify-end gap-2 px-3 pb-3 mt-auto">
        <DialNeutralButton size={ElementSize.Small} label={t(ButtonsI18nKey.Cancel)} onClick={handleCancel} />
        <DialPrimaryButton
          size={ElementSize.Small}
          label={t(ButtonsI18nKey.Apply)}
          onClick={handleApply}
          disabled={!canApply}
        />
      </div>
    </div>
  );

  return (
    <DialDropdown
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) resetDraft();
      }}
      allowedPlacements={['bottom-start', 'bottom-end']}
      renderOverlay={() => (
        <div className="flex flex-row items-stretch bg-layer-0 rounded border border-secondary shadow-lg">
          {presetList}
          {calendarPanel}
        </div>
      )}
    >
      <div
        role="button"
        className="dial-input flex w-full items-center justify-between gap-2 dial-small-text cursor-pointer min-h-[25px] px-1.5 py-1 !bg-layer-4 !h-auto"
      >
        <div className="flex w-full min-w-0 items-center gap-2 text-primary whitespace-nowrap">
          <span>
            {t(TelemetryI18nKey.TimePeriod)} {triggerLabel}
          </span>
        </div>
        <IconChevronDown {...BASE_BUTTON_ICON_PROPS} className={`text-primary ${isOpen ? 'rotate-180' : ''}`} />
      </div>
    </DialDropdown>
  );
};

export default TimeFilter;
