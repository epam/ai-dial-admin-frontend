'use client';

import { FC, KeyboardEvent, useEffect, useId, useState } from 'react';

import { Button, ButtonAppearance, ElementSize, NumberInput, Select } from '@epam/ai-dial-ui-kit';

import {
  HEALTH_DISTRIBUTION_THRESHOLD_PERCENT_MAX,
  HEALTH_DISTRIBUTION_THRESHOLD_PERCENT_MIN,
  HEALTH_DISTRIBUTION_WEEK_OPTIONS,
} from '@/src/components/EvalSystemHealth/constants';
import { HealthDistributionControlsProps } from '@/src/components/EvalSystemHealth/models';
import { parseThresholdPercent } from '@/src/components/EvalSystemHealth/utils/parse-threshold-percent';
import { ButtonsI18nKey, EvalSystemHealthI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const WEEK_SELECT_OPTIONS = HEALTH_DISTRIBUTION_WEEK_OPTIONS.map((count) => ({
  value: String(count),
  label: String(count),
}));

/**
 * The chart's period and healthy threshold. The period applies as soon as it is picked; the threshold is typed,
 * so it applies on Enter or blur, clamped to the allowed range, rather than a request per keystroke.
 */
const HealthDistributionControls: FC<HealthDistributionControlsProps> = ({
  weeks,
  thresholdPercent,
  isModified,
  onWeeksChange,
  onThresholdPercentChange,
  onReset,
}) => {
  const t = useI18n();
  const id = useId();
  const weeksId = `${id}-weeks`;
  const thresholdId = `${id}-threshold`;
  const [draft, setDraft] = useState(String(thresholdPercent));

  useEffect(() => {
    setDraft(String(thresholdPercent));
  }, [thresholdPercent]);

  const commitThreshold = () => {
    const parsed = parseThresholdPercent(draft);
    if (parsed == null) {
      setDraft(String(thresholdPercent));
      return;
    }
    setDraft(String(parsed));
    if (parsed !== thresholdPercent) {
      onThresholdPercentChange(parsed);
    }
  };

  const onThresholdKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      commitThreshold();
    }
  };

  return (
    <div
      role="group"
      aria-label={t(EvalSystemHealthI18nKey.HealthDistributionControlsLabel)}
      className="flex flex-wrap items-center gap-x-4 gap-y-2"
    >
      <div className="flex items-center gap-2">
        <label htmlFor={weeksId} className="dial-small-text text-secondary">
          {t(EvalSystemHealthI18nKey.HealthDistributionWeeksLabel)}
        </label>
        <Select
          id={weeksId}
          ariaLabel={t(EvalSystemHealthI18nKey.HealthDistributionWeeksLabel)}
          size={ElementSize.Small}
          className="w-[72px]"
          fieldClassName="w-[72px]"
          options={WEEK_SELECT_OPTIONS}
          value={String(weeks)}
          onChange={(value) => onWeeksChange(Number(value))}
        />
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor={thresholdId} className="dial-small-text text-secondary">
          {t(EvalSystemHealthI18nKey.HealthDistributionThresholdLabel)}
        </label>
        <NumberInput
          id={thresholdId}
          integer
          size={ElementSize.Small}
          containerClassName="w-[88px]"
          min={HEALTH_DISTRIBUTION_THRESHOLD_PERCENT_MIN}
          max={HEALTH_DISTRIBUTION_THRESHOLD_PERCENT_MAX}
          postfix="%"
          value={draft}
          onChange={(value) => setDraft(value == null ? '' : String(value))}
          onBlur={commitThreshold}
          onKeyDown={onThresholdKeyDown}
        />
      </div>
      {isModified && (
        <Button
          size={ElementSize.Small}
          appearance={ButtonAppearance.Ghost}
          label={t(ButtonsI18nKey.Reset)}
          onClick={onReset}
        />
      )}
    </div>
  );
};

export default HealthDistributionControls;
