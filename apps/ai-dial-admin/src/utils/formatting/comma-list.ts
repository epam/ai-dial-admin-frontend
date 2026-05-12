export const splitCommaList = (value: unknown): string[] => {
  if (typeof value !== 'string' || value.length === 0) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};
