'use client';

import { FC, FocusEvent, useCallback, useEffect, useMemo } from 'react';

import { Calendar, CalendarMode, CalendarValue, SelectOption, Select } from '@epam/ai-dial-ui-kit';

import { BasicI18nKey, SystemPropertiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { RateLimitSchedule as RateLimitScheduleModel, WeekDay } from '@/src/models/system-properties';
import { DEFAULT_RATE_LIMIT_SCHEDULE, RESET_TIME_PATTERN, WEEK_DAY_I18N_KEYS } from './constants';
import { isRateLimitScheduleValid, SUPPORTED_TIMEZONES } from './utils/rate-limit-schedule';

interface Props {
  schedule?: RateLimitScheduleModel;
  onChangeRateLimitSchedule: (schedule: RateLimitScheduleModel) => void;
}

const RateLimitSchedule: FC<Props> = ({ schedule, onChangeRateLimitSchedule }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { dispatch } = useSaveValidationContext();

  // An absent schedule displays Core's defaults but stays undefined in the page state, so the page
  // never goes falsely dirty; the first edit to any control materializes all three values (D2).
  const effectiveSchedule = schedule ?? DEFAULT_RATE_LIMIT_SCHEDULE;

  const timezoneOptions = useMemo<SelectOption[]>(
    () => SUPPORTED_TIMEZONES.map((timezone) => ({ value: timezone, label: timezone })),
    [],
  );

  const weekDayOptions = useMemo<SelectOption[]>(
    () => Object.values(WeekDay).map((day) => ({ value: day, label: t(WEEK_DAY_I18N_KEYS[day]) })),
    [t],
  );

  const isResetTimeInvalid = !RESET_TIME_PATTERN.test(effectiveSchedule.resetTime);

  // The full util, not just the reset-time check: a hand-edited stored value can be invalid in any
  // field, and Save must stay off until it is corrected (design D3).
  const isScheduleValid = isRateLimitScheduleValid(effectiveSchedule);

  useEffect(() => {
    dispatch({ type: ValidationActionType.SetField, field: 'rateLimitSchedule', isValid: isScheduleValid });

    return () => {
      dispatch({ type: ValidationActionType.RemoveField, field: 'rateLimitSchedule' });
    };
  }, [dispatch, isScheduleValid]);

  const onTimezoneChange = useCallback(
    (value: string | string[]) => {
      onChangeRateLimitSchedule({ ...effectiveSchedule, timezone: value as string });
    },
    [effectiveSchedule, onChangeRateLimitSchedule],
  );

  const onWeekStartDayChange = useCallback(
    (value: string | string[]) => {
      onChangeRateLimitSchedule({ ...effectiveSchedule, weekStartDay: value as WeekDay });
    },
    [effectiveSchedule, onChangeRateLimitSchedule],
  );

  const onResetTimeChange = useCallback(
    (value: CalendarValue) => {
      if (typeof value === 'string') {
        onChangeRateLimitSchedule({ ...effectiveSchedule, resetTime: value });
      }
    },
    [effectiveSchedule, onChangeRateLimitSchedule],
  );

  // Calendar emits only complete times; commit its visible draft on blur so Save cannot use a stale value.
  const onResetTimeBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (event.currentTarget.value !== effectiveSchedule.resetTime) {
        onResetTimeChange(event.currentTarget.value);
      }
    },
    [effectiveSchedule.resetTime, onResetTimeChange],
  );

  return (
    <div className="h-full flex flex-col pt-3">
      <div className="flex items-center mb-4 h-10">
        <h1>{t(TabsI18nKey.RateLimitSchedule)}</h1>
      </div>
      <p className="dial-small-text text-secondary mb-4 max-w-[560px]">
        {t(SystemPropertiesI18nKey.RateLimitScheduleDescription)}
      </p>
      <div className="flex flex-col gap-4 max-w-[420px]">
        <Select
          id="rate-limit-timezone"
          labelProps={{ label: t(SystemPropertiesI18nKey.TimezoneLabel) }}
          options={timezoneOptions}
          value={effectiveSchedule.timezone}
          searchable
          searchPlaceholder={t(BasicI18nKey.Search)}
          disabled={isReadOnlyAdmin}
          onChange={onTimezoneChange}
        />
        <Select
          id="rate-limit-week-start-day"
          labelProps={{ label: t(SystemPropertiesI18nKey.WeekStartDayLabel) }}
          options={weekDayOptions}
          value={effectiveSchedule.weekStartDay}
          disabled={isReadOnlyAdmin}
          onChange={onWeekStartDayChange}
        />
        <div className="flex flex-col gap-2">
          <Calendar
            id="rate-limit-reset-time"
            mode={CalendarMode.Time}
            labelProps={{ label: t(SystemPropertiesI18nKey.ResetTimeLabel) }}
            placeholder={t(SystemPropertiesI18nKey.ResetTimePlaceholder)}
            value={effectiveSchedule.resetTime}
            invalid={isResetTimeInvalid}
            disabled={isReadOnlyAdmin}
            showTimePicker
            onChange={onResetTimeChange}
            onBlur={onResetTimeBlur}
            className="gap-y-2"
            fieldClassName="dial-kit-input py-2 px-3 rounded-lg"
          />
          {isResetTimeInvalid && (
            <p role="alert" className="dial-small-text text-error">
              {t(SystemPropertiesI18nKey.ResetTimeInvalid)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RateLimitSchedule;
