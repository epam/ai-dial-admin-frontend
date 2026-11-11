export const resolveYFields = (
  yFields: string[] | null,
  yOptions: string[],
  xField: string | null,
  isMultiY: boolean,
): string[] => {
  if (yFields === null) {
    const fallback = yOptions.find((column) => column !== xField) ?? yOptions[0];
    return fallback ? [fallback] : [];
  }
  const valid = yFields.filter((column) => yOptions.includes(column));
  return isMultiY ? valid : valid.slice(0, 1);
};

export const keepValidYFields = (yFields: string[] | null, yOptions: string[], isMultiY: boolean): string[] | null => {
  const valid = (yFields ?? []).filter((column) => yOptions.includes(column));
  if (!valid.length) return null;
  return isMultiY ? valid : valid.slice(0, 1);
};
