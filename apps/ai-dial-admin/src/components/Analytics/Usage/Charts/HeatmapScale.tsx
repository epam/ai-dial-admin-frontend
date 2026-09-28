'use client';

import { FC } from 'react';

import classNames from 'classnames';

import {
  HEATMAP_SCALE_STEPS,
  getHeatmapCellColor,
  getHeatmapCellOpacity,
} from '@/src/components/Analytics/Usage/utils/heatmap';
import { AnalyticsUsageI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  className?: string;
}

/**
 * What a cell's shade means. The swatches step through the same ramp the grid paints with, so the
 * legend cannot describe a scale the cells do not use.
 */
const HeatmapScale: FC<Props> = ({ className }) => {
  const t = useI18n();

  return (
    <div className={classNames('flex items-center gap-2 dial-tiny-text text-secondary', className)}>
      <span>{t(AnalyticsUsageI18nKey.HeatmapScaleLow)}</span>
      <span aria-hidden className="flex items-center gap-1">
        {Array.from({ length: HEATMAP_SCALE_STEPS }, (_, step) => (
          <span
            key={step}
            className="h-3 w-6 rounded-sm"
            style={{ backgroundColor: getHeatmapCellColor(getHeatmapCellOpacity(step + 1, HEATMAP_SCALE_STEPS)) }}
          />
        ))}
      </span>
      <span>{t(AnalyticsUsageI18nKey.HeatmapScaleHigh)}</span>
    </div>
  );
};

export default HeatmapScale;
