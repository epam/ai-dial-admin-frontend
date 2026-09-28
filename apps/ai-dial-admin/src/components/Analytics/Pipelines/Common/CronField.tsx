'use client';

import { FC, useState } from 'react';

import { DialInput, DialSelectField } from '@epam/ai-dial-ui-kit';

import { CRON_CUSTOM_PRESET, CRON_PRESETS } from '@/src/constants/analytics/pipelines';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { getControlClassName } from '@/src/utils/entities/view';
import { isValidSixFieldCron } from '@/src/utils/analytics/cron';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const CronField: FC<Props> = ({ value, onChange }) => {
  const t = useI18n();

  const matchingPreset = CRON_PRESETS.find((preset) => preset.value === value);

  // An expression matching no preset *is* a custom one, so the selection is derived rather than stored —
  // a stored flag survives a discard, which restores the expression alone and would leave the two saying
  // different things. State is kept only for the one case the expression cannot express: Custom chosen
  // and nothing typed yet.
  const [isCustomChosen, setIsCustomChosen] = useState(false);
  const isCustom = isCustomChosen || (Boolean(value) && !matchingPreset);

  const presetOptions = [
    ...CRON_PRESETS.map((preset) => ({ value: preset.value, label: t(preset.labelKey) })),
    { value: CRON_CUSTOM_PRESET, label: t(AnalyticsPipelinesI18nKey.CronCustom) },
  ];

  const onPresetChange = (next: string) => {
    if (next === CRON_CUSTOM_PRESET) {
      setIsCustomChosen(true);
      return;
    }
    setIsCustomChosen(false);
    onChange(next);
  };

  const isInvalid = isCustom && Boolean(value) && !isValidSixFieldCron(value);

  return (
    <div className="flex flex-col gap-4">
      <DialSelectField
        id="rule-cron-preset"
        required
        containerClassName={getControlClassName()}
        label={t(AnalyticsPipelinesI18nKey.CronPreset)}
        options={presetOptions}
        value={isCustom ? CRON_CUSTOM_PRESET : (matchingPreset?.value ?? '')}
        onChange={(v) => onPresetChange(v as string)}
      />
      {isCustom && (
        <DialInput
          id="rule-cron-expression"
          containerClassName={getControlClassName()}
          labelProps={{ label: t(AnalyticsPipelinesI18nKey.CronExpression), required: true }}
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
