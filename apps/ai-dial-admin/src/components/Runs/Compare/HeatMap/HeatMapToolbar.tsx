'use client';

import { DialSegmentedControl, SegmentedControlOption } from '@epam/ai-dial-ui-kit';
import { IconChevronDown } from '@tabler/icons-react';
import { FC, useMemo } from 'react';

import { HeatMapColourDisplayMode } from '@/src/components/Runs/Compare/HeatMap/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  colourDisplayMode: HeatMapColourDisplayMode;
  onColourDisplayModeChange: (mode: HeatMapColourDisplayMode) => void;
}

const HeatMapToolbar: FC<Props> = ({ colourDisplayMode, onColourDisplayModeChange }) => {
  const t = useI18n();

  const colourDisplayOptions = useMemo<SegmentedControlOption<HeatMapColourDisplayMode>[]>(
    () => [
      { value: HeatMapColourDisplayMode.Absolute, label: t(RunsI18nKey.RunCompareAbsoluteValues) },
      { value: HeatMapColourDisplayMode.Delta, label: t(RunsI18nKey.RunCompareDelta), disabled: true },
    ],
    [t],
  );

  return (
    <div className="flex items-center gap-4 shrink-0">
      <button
        type="button"
        disabled
        className="inline-flex items-center gap-1 rounded-sm bg-layer-3 px-1.5 py-1 dial-small-text text-primary opacity-70 cursor-not-allowed"
        aria-disabled
      >
        <span>{t(RunsI18nKey.RunCompareHeatMapMetricsAll)}</span>
        <IconChevronDown size={16} className="shrink-0 text-secondary" aria-hidden />
      </button>

      <div className="flex items-center gap-1">
        <span className="dial-small-text text-secondary whitespace-nowrap">
          {t(RunsI18nKey.RunCompareColourDisplay)}
        </span>
        <DialSegmentedControl
          options={colourDisplayOptions}
          value={colourDisplayMode}
          onChange={onColourDisplayModeChange}
          ariaLabel={t(RunsI18nKey.RunCompareColourDisplay)}
        />
      </div>
    </div>
  );
};

export default HeatMapToolbar;
