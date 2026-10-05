'use client';

import { FC, useState } from 'react';

import { Input, Select } from '@epam/ai-dial-ui-kit';

import {
  CRON_CUSTOM_PRESET,
  CRON_EVERY_MINUTE_PRESET,
  CRON_PRESETS,
  PIPELINE_SELECT_DEFAULTS,
} from '@/src/constants/analytics/pipelines';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { getControlClassName } from '@/src/utils/entities/view';
import { isEveryMinuteCron, isValidSixFieldCron } from '@/src/utils/analytics/cron';

interface Props {
  value: string;
  /**
   * Whether the service defaults an absent cron — true for an enrichment, never for an aggregate. Offers
   * Every minute, reads an empty value as it, and drops the required mark.
   */
  isDefaultable?: boolean;
  onChange: (value: string) => void;
}

const CronField: FC<Props> = ({ value, isDefaultable = false, onChange }) => {
  const t = useI18n();

  const matchingPreset = CRON_PRESETS.find((preset) => preset.value === value);

  // An expression matching no preset *is* a custom one, so the selection is derived rather than stored —
  // a stored flag survives a discard, which restores the expression alone and would leave the two saying
  // different things. State is kept only for the one case the expression cannot express: Custom chosen
  // and nothing typed yet.
  const [isCustomChosen, setIsCustomChosen] = useState(false);
  const isEveryMinute = isDefaultable && !isCustomChosen && (!value.trim() || isEveryMinuteCron(value));
  const isCustom = isCustomChosen || (Boolean(value) && !matchingPreset && !isEveryMinute);

  const getSelectedPreset = (): string => {
    if (isCustom) return CRON_CUSTOM_PRESET;
    if (isEveryMinute) return CRON_EVERY_MINUTE_PRESET;
    return matchingPreset?.value ?? '';
  };

  const presetOptions = [
    ...(isDefaultable
      ? [{ value: CRON_EVERY_MINUTE_PRESET, label: t(AnalyticsPipelinesI18nKey.CronEveryMinute) }]
      : []),
    ...CRON_PRESETS.map((preset) => ({ value: preset.value, label: t(preset.labelKey) })),
    { value: CRON_CUSTOM_PRESET, label: t(AnalyticsPipelinesI18nKey.CronCustom) },
  ];

  const onPresetChange = (next: string) => {
    if (next === CRON_CUSTOM_PRESET) {
      setIsCustomChosen(true);
      return;
    }
    setIsCustomChosen(false);
    // Cleared rather than set, so the service picks the second; a cron already of that shape is kept.
    if (next === CRON_EVERY_MINUTE_PRESET) {
      if (!isEveryMinuteCron(value)) onChange('');
      return;
    }
    onChange(next);
  };

  const isInvalid = isCustom && Boolean(value) && !isValidSixFieldCron(value);

  return (
    <div className="flex flex-col gap-4">
      <Select
        {...PIPELINE_SELECT_DEFAULTS}
        id="rule-cron-preset"
        className={getControlClassName()}
        labelProps={{ label: t(AnalyticsPipelinesI18nKey.CronPreset), required: !isDefaultable }}
        options={presetOptions}
        value={getSelectedPreset()}
        onChange={(v) => onPresetChange(v as string)}
      />
      {isCustom && (
        <Input
          id="rule-cron-expression"
          containerClassName={getControlClassName()}
          labelProps={{ label: t(AnalyticsPipelinesI18nKey.CronExpression), required: !isDefaultable }}
          value={value}
          className="font-mono"
          error={isInvalid ? t(AnalyticsPipelinesI18nKey.CronInvalid) : undefined}
          invalid={isInvalid}
          onChange={(v) => onChange(v ?? '')}
        />
      )}
    </div>
  );
};

export default CronField;
