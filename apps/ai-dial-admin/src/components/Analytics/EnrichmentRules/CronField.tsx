'use client';

import { FC, useState } from 'react';

import { DialInput, DialSelectField } from '@epam/ai-dial-ui-kit';

import { CRON_CUSTOM_PRESET, CRON_PRESETS } from '@/src/constants/analytics/enrichment-rules';
import { AnalyticsEnrichmentRulesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { isValidSixFieldCron } from '@/src/utils/analytics/cron';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const CronField: FC<Props> = ({ value, onChange }) => {
  const t = useI18n();

  const matchingPreset = CRON_PRESETS.find((preset) => preset.value === value);
  const [isCustom, setIsCustom] = useState(() => Boolean(value) && !matchingPreset);

  const presetOptions = [
    ...CRON_PRESETS.map((preset) => ({ value: preset.value, label: t(preset.labelKey) })),
    { value: CRON_CUSTOM_PRESET, label: t(AnalyticsEnrichmentRulesI18nKey.CronCustom) },
  ];

  const onPresetChange = (next: string) => {
    if (next === CRON_CUSTOM_PRESET) {
      setIsCustom(true);
      return;
    }
    setIsCustom(false);
    onChange(next);
  };

  const isInvalid = isCustom && Boolean(value) && !isValidSixFieldCron(value);

  return (
    <div className="flex flex-col gap-4">
      <DialSelectField
        id="rule-cron-preset"
        required
        label={t(AnalyticsEnrichmentRulesI18nKey.CronPreset)}
        options={presetOptions}
        value={isCustom ? CRON_CUSTOM_PRESET : (matchingPreset?.value ?? '')}
        onChange={(v) => onPresetChange(v as string)}
      />
      {isCustom && (
        <DialInput
          id="rule-cron-expression"
          labelProps={{ label: t(AnalyticsEnrichmentRulesI18nKey.CronExpression), required: true }}
          value={value}
          className="font-mono"
          error={isInvalid ? t(AnalyticsEnrichmentRulesI18nKey.CronInvalid) : undefined}
          invalid={isInvalid}
          onChange={(v) => onChange(v ?? '')}
        />
      )}
    </div>
  );
};

export default CronField;
