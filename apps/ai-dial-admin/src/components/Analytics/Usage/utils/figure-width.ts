import { BreakdownRowModel } from '@/src/components/Analytics/Usage/models';

const NARROW_CHARS = /[,.]/g;
const NARROW_CHAR_SHRINK_CH = 0.5;
const NO_FIGURE = '—';

export const getFigureRulerVar = (colId: string): string => `--breakdown-figure-ruler-${colId}`;

export const estimateFigureWidthCh = (text: string): number => {
  const narrowCount = text.match(NARROW_CHARS)?.length ?? 0;

  return text.length - narrowCount * NARROW_CHAR_SHRINK_CH;
};

export const pickWidestFigures = (
  rows: BreakdownRowModel[],
  formats: Record<string, (row: BreakdownRowModel) => string | null>,
  widest: Record<string, string> = {},
): Record<string, string> => {
  const result = { ...widest };

  for (const row of rows) {
    for (const [colId, format] of Object.entries(formats)) {
      const text = format(row) ?? NO_FIGURE;
      const current = result[colId];

      if (current == null || estimateFigureWidthCh(text) > estimateFigureWidthCh(current)) {
        result[colId] = text;
      }
    }
  }

  return result;
};
