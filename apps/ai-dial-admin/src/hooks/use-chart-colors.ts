import { useMemo } from 'react';

import { ChartColors } from '@/src/components/Common/MetricCard/models';
import { getChartColors } from '@/src/components/Common/MetricCard/utils';
import { useThemePalette } from '@/src/hooks/use-theme-palette';

export const useChartColors = (): ChartColors => {
  const palette = useThemePalette();
  return useMemo(() => getChartColors(palette), [palette]);
};
