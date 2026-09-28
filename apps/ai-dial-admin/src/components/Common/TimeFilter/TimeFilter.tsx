import {
  DIAL_ICON_SIZE,
  DIAL_KIT_ICON_STROKE,
  DialDropdown,
  DialNeutralButton,
  DialPrimaryButton,
  ElementSize,
} from '@epam/ai-dial-ui-kit';
import { IconChevronDown } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';

import RangePicker from '@/src/components/Common/RangePicker/RangePicker';
import { TimeFilterAppearance } from '@/src/components/Common/TimeFilter/models';
import { MS_PER_DAY, TimeFilterOption, getTimePeriodOptionsByMaxMs } from '@/src/constants/global-time-filter';
import { ButtonsI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { TimeRange } from '@/src/models/time-range';
import { getTimeRangeById } from '@/src/utils/time-filter/get-time-range-id';
import { formatDate } from '@/src/utils/time-filter/period-label';

/**
 * `Modern` puts this filter next to ui-kit 2.0 `Select`s, so it has to read as one of them.
 *
 * The trigger borrows the 2.0 field classes rather than restating their metrics — measured, the two
 * boxes come out identical: 24px tall, 8px radius, 1px border, 12/16 text. It is not a `Select`'s
 * own `Input`, because that field's inner `<input>` is `w-full` and cannot be overridden, which
 * pins the control to a text input's intrinsic width instead of its label's. The overlay and its
 * rows also restate the 2.0 surface: those classes live in a ui-kit module the package does not export.
 */
const MODERN_TRIGGER_CLASS = 'dial-kit-input dial-kit-input-small !w-auto gap-x-1 px-2';
const LEGACY_TRIGGER_CLASS =
  'dial-input dial-small-text min-h-[25px] !h-auto !bg-layer-4 w-full gap-2 whitespace-nowrap px-1.5 py-1';

/**
 * `DialDropdown` already paints its floating container — `rounded bg-layer-0 shadow` — so a nested
 * surface only ever shows through at the corners. The 2.0 look replaces that container's own
 * classes, which is why each one is forced.
 */
const MODERN_LIST_CLASS = '!rounded-xl p-1 !shadow-md ![background-color:var(--bg-layer-raised)]';
const LEGACY_OVERLAY_CLASS = 'rounded border border-secondary bg-layer-0 shadow-lg';

/** Mirrors `overlayItemClassName`, the row every 2.0 `MenuItem` — and so every `Select` option — is. */
const MODERN_OPTION_CLASS =
  'flex h-[40px] w-full cursor-pointer items-center gap-2 truncate rounded-lg px-3 dial-small-text text-primary hover:bg-control-accent-alpha-hover focus-visible:outline focus-visible:outline-focus';
const LEGACY_OPTION_CLASS =
  'flex w-full items-center whitespace-nowrap px-3 py-2 text-left small text-primary hover:bg-layer-3';

const MODERN_OPTION_SELECTED_CLASS = 'bg-control-accent-alpha';
const LEGACY_OPTION_SELECTED_CLASS = 'bg-layer-3';

const MODERN_DIVIDER_CLASS = 'my-1 border-t border-tertiary';
const LEGACY_DIVIDER_CLASS = 'border-t border-secondary';

/** A 2.0 row truncates its label; the legacy one never wrapped, so it keeps growing the panel. */
const MODERN_LABEL_CLASS = 'min-w-0 flex-1 truncate text-start';
const LEGACY_LABEL_CLASS = 'whitespace-nowrap';

const MODERN_RANGE_HINT_CLASS = 'shrink-0 text-secondary dial-small-text';
const LEGACY_RANGE_HINT_CLASS = 'ml-2 text-secondary';

const MODERN_CHEVRON_PROPS = { size: DIAL_ICON_SIZE.SM, stroke: DIAL_KIT_ICON_STROKE };

type DraftMode = { mode: 'preset'; presetId: string } | { mode: 'custom'; range: TimeRange | null };

interface Props {
  timePeriod: string;
  onTimePeriodChange: (value: string) => void;
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange, isCustom?: boolean) => void;
  timePeriodOptions?: TimeFilterOption[];
  maxRangeMs?: number;
  appearance?: TimeFilterAppearance;
}

const TimeFilter: FC<Props> = ({
  timePeriod,
  onTimePeriodChange,
  timeRange,
  onTimeRangeChange,
  timePeriodOptions,
  maxRangeMs,
  appearance = TimeFilterAppearance.Legacy,
}) => {
  const t = useI18n();
  const isModern = appearance === TimeFilterAppearance.Modern;
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

  const optionClass = isModern ? MODERN_OPTION_CLASS : LEGACY_OPTION_CLASS;
  const selectedOptionClass = isModern ? MODERN_OPTION_SELECTED_CLASS : LEGACY_OPTION_SELECTED_CLASS;
  const labelClass = isModern ? MODERN_LABEL_CLASS : LEGACY_LABEL_CLASS;

  const presetList = (
    <ul className={classNames('flex min-w-[180px] flex-col', !isModern && 'py-1')}>
      {options.map((opt) => (
        <li key={opt.value}>
          <button
            type="button"
            onClick={() => handlePresetClick(opt.value)}
            className={classNames(
              optionClass,
              !isCustom && timePeriod === opt.value && !showCalendar && selectedOptionClass,
            )}
          >
            <span className={labelClass}>{opt.label}</span>
          </button>
        </li>
      ))}
      <li aria-hidden className={isModern ? MODERN_DIVIDER_CLASS : LEGACY_DIVIDER_CLASS} />
      <li>
        <button
          type="button"
          onClick={handleCustomClick}
          className={classNames(optionClass, showCalendar && selectedOptionClass)}
        >
          <span className={labelClass}>{t(TelemetryI18nKey.Custom)}</span>
          {draft.mode === 'custom' && draft.range && (
            <span className={isModern ? MODERN_RANGE_HINT_CLASS : LEGACY_RANGE_HINT_CLASS}>
              {formatDate(draft.range.startDate)} - {formatDate(draft.range.endDate)}
            </span>
          )}
        </button>
      </li>
    </ul>
  );

  const calendarPanel = showCalendar && (
    <div className={classNames('flex flex-col border-l', isModern ? 'border-tertiary' : 'border-secondary')}>
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
      matchReferenceWidth={false}
      listClassName={isModern ? MODERN_LIST_CLASS : void 0}
      renderOverlay={() => (
        <div className={classNames('flex flex-row items-stretch', !isModern && LEGACY_OVERLAY_CLASS)}>
          {presetList}
          {calendarPanel}
        </div>
      )}
    >
      <div
        role="button"
        className={classNames(
          'flex cursor-pointer items-center justify-between text-primary',
          isModern ? MODERN_TRIGGER_CLASS : LEGACY_TRIGGER_CLASS,
        )}
      >
        <span className={classNames('min-w-0', !isModern && 'whitespace-nowrap')}>
          {t(TelemetryI18nKey.TimePeriod)} {triggerLabel}
        </span>
        <IconChevronDown
          {...(isModern ? MODERN_CHEVRON_PROPS : BASE_BUTTON_ICON_PROPS)}
          aria-hidden
          className={classNames(
            isModern ? 'text-secondary transition-transform' : 'text-primary',
            isOpen && 'rotate-180',
          )}
        />
      </div>
    </DialDropdown>
  );
};

export default TimeFilter;
