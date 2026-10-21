'use client';

import { FC } from 'react';

import { ButtonAppearance, ButtonDropdown, ButtonVariant, DropdownItem, Input } from '@epam/ai-dial-ui-kit';

import { CRON_PRESETS } from '@/src/constants/analytics/pipelines';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { isEveryMinuteCron, isValidSixFieldCron } from '@/src/utils/analytics/cron';
import { getControlClassName } from '@/src/utils/entities/view';

interface Props {
  value: string;
  /**
   * Whether the service defaults an absent cron — true for an enrichment, never for an aggregate. Offers
   * Every minute, reads an empty value as it, and drops the required mark.
   */
  isDefaultable?: boolean;
  onChange: (value: string) => void;
}

const EVERY_MINUTE_KEY = 'every-minute';

/**
 * One field for a schedule: the expression is always the input, and the presets are a menu that fills it.
 *
 * There is no mode to be in, and nothing under the input to keep in step with it: a discard or a reload that
 * restores the expression alone leaves the control showing exactly that.
 */
const CronField: FC<Props> = ({ value, isDefaultable = false, onChange }) => {
  const t = useI18n();

  const isEveryMinute = isDefaultable && (!value.trim() || isEveryMinuteCron(value));
  const isInvalid = Boolean(value.trim()) && !isEveryMinute && !isValidSixFieldCron(value);

  const onPickEveryMinute = () => {
    // Cleared rather than set, so the service picks the second; a cron already of that shape is kept.
    if (!isEveryMinuteCron(value)) onChange('');
  };

  const items: DropdownItem[] = [
    ...(isDefaultable
      ? [{ key: EVERY_MINUTE_KEY, label: t(AnalyticsPipelinesI18nKey.CronEveryMinute), onClick: onPickEveryMinute }]
      : []),
    ...CRON_PRESETS.map((item) => ({
      key: item.value,
      label: t(item.labelKey),
      onClick: () => onChange(item.value),
    })),
  ];

  return (
    <div className="flex flex-row items-end gap-2">
      <Input
        id="rule-cron-expression"
        containerClassName={getControlClassName()}
        labelProps={{ label: t(AnalyticsPipelinesI18nKey.CronSchedule), required: !isDefaultable }}
        value={value}
        aria-required={!isDefaultable}
        className="font-mono"
        placeholder={isDefaultable ? t(AnalyticsPipelinesI18nKey.CronEveryMinute) : undefined}
        error={isInvalid ? t(AnalyticsPipelinesI18nKey.CronInvalid) : undefined}
        invalid={isInvalid}
        onChange={(v) => onChange(v ?? '')}
      />
      <ButtonDropdown
        label={t(AnalyticsPipelinesI18nKey.CronPresets)}
        variant={ButtonVariant.Neutral}
        appearance={ButtonAppearance.Outlined}
        items={items}
      />
    </div>
  );
};

export default CronField;
