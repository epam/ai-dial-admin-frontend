import { DEFAULT_THEME } from '@/src/constants/theme';

import { HeatColorSegment } from './models';

export const ACCURACY_COLOR_MAP: Record<number, HeatColorSegment> = {
  0.1: { bg: '#69100B', border: '#ff6b6b' },
  0.2: { bg: '#6C210D', border: '#f26b5b' },
  0.3: { bg: '#59210A', border: '#e5764a' },
  0.4: { bg: '#5f2b18', border: '#a57a1d' },
  0.5: { bg: '#53320E', border: '#956b40' },
  0.6: { bg: '#362A0E', border: '#ad992f' },
  0.7: { bg: '#403d12', border: '#9aa63c' },
  0.8: { bg: '#223513', border: '#67a455' },
  0.9: { bg: '#0D3726', border: '#4ecba8' },
  1.0: { bg: '#022D1C', border: '#4dc87a' },
};

export const ACCURACY_COLOR_MAP_LIGHT: Record<number, HeatColorSegment> = {
  0.1: { bg: '#ffc9cb', border: '#ff6b6b' },
  0.2: { bg: '#ffd9d1', border: '#f26b5b' },
  0.3: { bg: '#fddece', border: '#e5764a' },
  0.4: { bg: '#fdecc4', border: '#a57a1d' },
  0.5: { bg: '#f9e3c0', border: '#956b40' },
  0.6: { bg: '#f5eda0', border: '#ad992f' },
  0.7: { bg: '#e8f0a0', border: '#9aa63c' },
  0.8: { bg: '#c8edbc', border: '#67a455' },
  0.9: { bg: '#a1f5bf', border: '#4ecba8' },
  1.0: { bg: '#85f3ac', border: '#4dc87a' },
};

export const ACCURACY_THRESHOLDS = Object.keys(ACCURACY_COLOR_MAP)
  .map(Number)
  .sort((a, b) => a - b);

export const DELTA_NEGATIVE_COLOR_MAP: Record<number, HeatColorSegment> = {
  [-0.25]: { bg: '#2b0f04', border: '#b5552f' },
  [-0.5]: { bg: '#481719', border: '#a35638' },
  [-0.75]: { bg: '#6c210d', border: '#eb503e' },
  [-1.0]: { bg: '#820610', border: '#ff4e50' },
};

export const DELTA_NEGATIVE_COLOR_MAP_LIGHT: Record<number, HeatColorSegment> = {
  [-0.25]: { bg: '#ffece9', border: '#b5552f' },
  [-0.5]: { bg: '#fddece', border: '#a35638' },
  [-0.75]: { bg: '#ffd9d1', border: '#eb503e' },
  [-1.0]: { bg: '#ffc9cb', border: '#ff4e50' },
};

export const DELTA_POSITIVE_COLOR_MAP: Record<number, HeatColorSegment> = {
  0.25: { bg: '#1e2a16', border: '#7fa666' },
  0.5: { bg: '#283f16', border: '#378520' },
  0.75: { bg: '#30511b', border: '#4a950e' },
  1.0: { bg: '#32640b', border: '#30e070' },
};

export const DELTA_POSITIVE_COLOR_MAP_LIGHT: Record<number, HeatColorSegment> = {
  0.25: { bg: '#ecf7ea', border: '#7fa666' },
  0.5: { bg: '#dffaeb', border: '#378520' },
  0.75: { bg: '#d3f1c8', border: '#4a950e' },
  1.0: { bg: '#a8ecc0', border: '#30e070' },
};

export const DELTA_NEUTRAL_SEGMENT = {
  bg: 'var(--bg-layer-2, #161b2d)',
  border: 'var(--stroke-secondary, #242c42)',
};

export const DELTA_NEGATIVE_THRESHOLDS = Object.keys(DELTA_NEGATIVE_COLOR_MAP)
  .map(Number)
  .sort((a, b) => a - b);

export const DELTA_POSITIVE_THRESHOLDS = Object.keys(DELTA_POSITIVE_COLOR_MAP)
  .map(Number)
  .sort((a, b) => a - b);

export const DELTA_SCALE_THRESHOLDS = [...DELTA_NEGATIVE_THRESHOLDS, 0, ...DELTA_POSITIVE_THRESHOLDS] as const;

export const isDarkHeatMapTheme = (theme: string = DEFAULT_THEME): boolean => theme === DEFAULT_THEME;

export const getAccuracyColorMap = (theme: string = DEFAULT_THEME): Record<number, HeatColorSegment> =>
  isDarkHeatMapTheme(theme) ? ACCURACY_COLOR_MAP : ACCURACY_COLOR_MAP_LIGHT;

export const getDeltaNegativeColorMap = (theme: string = DEFAULT_THEME): Record<number, HeatColorSegment> =>
  isDarkHeatMapTheme(theme) ? DELTA_NEGATIVE_COLOR_MAP : DELTA_NEGATIVE_COLOR_MAP_LIGHT;

export const getDeltaPositiveColorMap = (theme: string = DEFAULT_THEME): Record<number, HeatColorSegment> =>
  isDarkHeatMapTheme(theme) ? DELTA_POSITIVE_COLOR_MAP : DELTA_POSITIVE_COLOR_MAP_LIGHT;
