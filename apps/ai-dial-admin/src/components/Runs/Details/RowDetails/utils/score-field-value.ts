/**
 * The numeric score a panel field renders as a cell-filling `ScoreCellValue`, or `null` when it
 * renders as text instead (not a score field, failed, missing, or not a number). Shared by
 * `FieldValue` and the cell wrappers that drop their padding for a score.
 */
export const getScoreFieldValue = (
  raw: string | null,
  isScoreIndicator: boolean,
  isFailed?: boolean,
): number | null => {
  if (!isScoreIndicator || isFailed || raw === null) return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
};
