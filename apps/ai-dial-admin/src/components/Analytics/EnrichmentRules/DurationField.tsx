'use client';

import { FC } from 'react';

import { DialInput, DialSelectField } from '@epam/ai-dial-ui-kit';

import { AnalyticsEnrichmentRulesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DurationUnit, formatDuration, parseDuration } from '@/src/utils/analytics/duration';

const UNIT_LABEL: Record<DurationUnit, AnalyticsEnrichmentRulesI18nKey> = {
  [DurationUnit.Milliseconds]: AnalyticsEnrichmentRulesI18nKey.UnitMilliseconds,
  [DurationUnit.Seconds]: AnalyticsEnrichmentRulesI18nKey.UnitSeconds,
  [DurationUnit.Minutes]: AnalyticsEnrichmentRulesI18nKey.UnitMinutes,
  [DurationUnit.Hours]: AnalyticsEnrichmentRulesI18nKey.UnitHours,
  [DurationUnit.Days]: AnalyticsEnrichmentRulesI18nKey.UnitDays,
};

interface Props {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
}

const DurationField: FC<Props> = ({ id, label, value, onChange }) => {
  const t = useI18n();

  const parsed = parseDuration(value);
  const isRaw = Boolean(value) && parsed == null;

  const unitOptions = Object.values(DurationUnit).map((unit) => ({ value: unit, label: t(UNIT_LABEL[unit]) }));

  const onAmountChange = (next?: string) => {
    // Only whole numbers round-trip through the wire format, so a fractional entry is not formatted
    // into a value the codec would then fail to read back.
    const amount = Number.parseInt(next ?? '', 10);
    if (!next || Number.isNaN(amount) || amount < 0) {
      onChange('');
      return;
    }
    onChange(formatDuration({ amount, unit: parsed?.unit ?? DurationUnit.Minutes }));
  };

  // Without an amount there is no duration to re-express, and emitting one would satisfy the caller's
  // "a readiness condition is set" check with a value the operator never entered.
  const onUnitChange = (unit: DurationUnit) => {
    if (!parsed) return;
    onChange(formatDuration({ amount: parsed.amount, unit }));
  };

  if (isRaw) {
    return (
      <DialInput
        id={id}
        labelProps={{ label }}
        value={value}
        caption={t(AnalyticsEnrichmentRulesI18nKey.DurationRaw)}
        onChange={(v) => onChange(v ?? '')}
      />
    );
  }

  return (
    <div className="flex items-end gap-2">
      <DialInput
        id={id}
        type="number"
        min={0}
        step={1}
        labelProps={{ label }}
        value={parsed ? String(parsed.amount) : ''}
        containerClassName="flex-1"
        onChange={onAmountChange}
      />
      <DialSelectField
        id={`${id}-unit`}
        label={t(AnalyticsEnrichmentRulesI18nKey.DurationUnit)}
        options={unitOptions}
        value={parsed?.unit ?? DurationUnit.Minutes}
        containerClassName="flex-1"
        onChange={(v) => onUnitChange(v as DurationUnit)}
      />
    </div>
  );
};

export default DurationField;
