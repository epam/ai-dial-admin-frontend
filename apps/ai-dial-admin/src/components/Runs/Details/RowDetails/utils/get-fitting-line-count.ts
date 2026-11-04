/**
 * How many whole lines of `lineHeight` px fit in `height` px, never fewer than one. `undefined` while the
 * height is unknown (an element that has not been laid out reports 0), so the caller leaves the text unclamped.
 */
export const getFittingLineCount = (height: number, lineHeight: number): number | undefined => {
  if (!(height > 0) || !(lineHeight > 0)) return undefined;
  return Math.max(1, Math.floor(height / lineHeight));
};
