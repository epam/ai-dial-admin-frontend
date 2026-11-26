'use client';

import { FC, useId, useState } from 'react';

import { Input } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import RangePicker from '@/src/components/Common/RangePicker/RangePicker';
import { PeriodChipForm } from '@/src/components/Analytics/QueryBuilder/Chips/models';
import { periodPresetLabel } from '@/src/components/Analytics/QueryBuilder/Chips/utils/labels';
import { toDateText, toTypedRange } from '@/src/components/Analytics/QueryBuilder/Chips/utils/period';
import { timePeriodOptionsConfig } from '@/src/constants/global-time-filter';
import { QueryChipsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TimeRange } from '@/src/models/time-range';

interface Props {
  form: PeriodChipForm;
  onChange: (form: PeriodChipForm) => void;
}

const WEEK_DAY_LETTERS = 3;

const formatWeekDay = (dayName: string): string => dayName.slice(0, WEEK_DAY_LETTERS);

const PeriodForm: FC<Props> = ({ form, onChange }) => {
  const t = useI18n();
  const id = useId();
  const [startText, setStartText] = useState(() => toDateText(form.range?.startDate));
  const [endText, setEndText] = useState(() => toDateText(form.range?.endDate));
  const [typedCount, setTypedCount] = useState(0);

  const onPickRange = (range: TimeRange | null) => {
    setStartText(toDateText(range?.startDate));
    setEndText(toDateText(range?.endDate));
    onChange({ ...form, isCustom: true, range });
  };

  const onTypeRange = (nextStart: string, nextEnd: string) => {
    setStartText(nextStart);
    setEndText(nextEnd);
    onChange({ ...form, isCustom: true, range: toTypedRange(nextStart, nextEnd) });
    setTypedCount((count) => count + 1);
  };

  const onPickPreset = (period: string) => {
    setStartText('');
    setEndText('');
    onChange({ period, isCustom: false, range: null });
    setTypedCount((count) => count + 1);
  };

  return (
    <div className="flex gap-8">
      <div className="flex w-[200px] shrink-0 flex-col gap-2 rounded-lg bg-layer-sunken p-3">
        <h3 className="px-2 text-primary dial-small-semi-text">{t(QueryChipsI18nKey.PeriodPresets)}</h3>
        <ul className="flex flex-col gap-0.5">
          {timePeriodOptionsConfig.map((option) => {
            const isSelected = !form.isCustom && form.period === option.value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  className={classNames(
                    'flex h-10 w-full items-center rounded-md px-3 text-primary dial-small-text hover:bg-control-accent-alpha focus-visible:bg-control-accent-alpha',
                    isSelected && 'bg-control-accent-alpha',
                  )}
                  onClick={() => onPickPreset(option.value)}
                >
                  {periodPresetLabel(option, t)}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="dial-range-calendar-wide flex min-w-0 flex-1 flex-col gap-3">
        <h3 className="text-primary dial-small-semi-text">{t(QueryChipsI18nKey.PeriodCustomRange)}</h3>
        <RangePicker
          key={typedCount}
          value={form.isCustom ? form.range : null}
          onChange={onPickRange}
          formatWeekDay={formatWeekDay}
        />
        <div className="flex gap-4">
          <Input
            id={`${id}-start`}
            labelProps={{ label: t(QueryChipsI18nKey.PeriodStart) }}
            placeholder={t(QueryChipsI18nKey.PeriodStartPlaceholder)}
            value={startText}
            onChange={(value) => onTypeRange(value ?? '', endText)}
          />
          <Input
            id={`${id}-end`}
            labelProps={{ label: t(QueryChipsI18nKey.PeriodEnd) }}
            placeholder={t(QueryChipsI18nKey.PeriodEndPlaceholder)}
            value={endText}
            onChange={(value) => onTypeRange(startText, value ?? '')}
          />
        </div>
      </div>
    </div>
  );
};

export default PeriodForm;
