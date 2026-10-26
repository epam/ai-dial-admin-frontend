import { TREND_TAG_PALETTE_DARK, TREND_TAG_PALETTE_LIGHT } from '@/src/components/TestSuites/Trends/constants';
import { TrendTagPaletteEntry } from '@/src/components/TestSuites/Trends/models';
import { EDITOR_THEMES } from '@/src/types/editor';

export const getTrendTagPalette = (theme: string): TrendTagPaletteEntry[] =>
  theme === EDITOR_THEMES.dark ? TREND_TAG_PALETTE_DARK : TREND_TAG_PALETTE_LIGHT;
