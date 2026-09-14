'use client';

import { FC, useEffect, useState } from 'react';

import { DialInput, DialSelect } from '@epam/ai-dial-ui-kit';

import { DURATION_CUSTOM_PRESET } from '@/src/constants/analytics/pipelines';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  id: string;
  /** Not rendered: the control sits beside the sentence that names it, and a label would repeat it. */
  label: string;
  presets: string[];
  value?: string;
  caption?: string;
  isDisabled?: boolean;
  onChange: (value: string) => void;
}

/**
 * A duration as one of a few sensible values, with a custom entry for anything else. The service accepts
 * both the short form (`30m`) and ISO-8601 (`PT30M`), so a value written through the API round-trips
 * here rather than being discarded — which is what the custom entry is seeded with.
 *
 * The label is carried as an accessible name rather than drawn, so assistive technology still reads which
 * condition the control belongs to while the row stays one line.
 */
const DurationPresetField: FC<Props> = ({ id, label, presets, value, caption, isDisabled, onChange }) => {
  const t = useI18n();

  const matchingPreset = presets.find((preset) => preset === value);
  const [isCustom, setIsCustom] = useState(() => Boolean(value) && !matchingPreset);

  // A value restored by a discard decides the mode again: a preset closes the custom entry, and a written
  // duration reopens it.
  useEffect(() => {
    if (value && !presets.includes(value)) setIsCustom(true);
    if (value && presets.includes(value)) setIsCustom(false);
  }, [value, presets]);

  const options = [
    ...presets.map((preset) => ({ value: preset, label: preset })),
    { value: DURATION_CUSTOM_PRESET, label: t(AnalyticsPipelinesI18nKey.DurationCustom) },
  ];

  const onPresetChange = (next: string) => {
    if (next === DURATION_CUSTOM_PRESET) {
      setIsCustom(true);
      return;
    }
    setIsCustom(false);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-1" role="group" aria-label={label}>
      <div className="flex flex-row flex-wrap items-center gap-2">
        <DialSelect
          elementId={id}
          className="w-[140px]"
          options={options}
          value={isCustom ? DURATION_CUSTOM_PRESET : (matchingPreset ?? '')}
          disabled={isDisabled}
          onChange={(v) => onPresetChange(v as string)}
        />
        {isCustom && (
          <DialInput
            id={`${id}-custom`}
            wrapperClassName="w-[180px]"
            aria-label={`${label} ${t(AnalyticsPipelinesI18nKey.DurationCustom)}`}
            value={value ?? ''}
            placeholder={t(AnalyticsPipelinesI18nKey.DurationCustomPlaceholder)}
            disabled={isDisabled}
            onChange={(v) => onChange(v ?? '')}
          />
        )}
      </div>
      {caption && <span className="text-secondary dial-tiny-text">{caption}</span>}
    </div>
  );
};

export default DurationPresetField;
