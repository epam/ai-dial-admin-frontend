const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Reads Core's `YYYY-MM-DD` string as a local-time `Date`. Local components are used on purpose:
 * `new Date('YYYY-MM-DD')` is UTC midnight and shows as the previous day west of Greenwich.
 * Returns `null` for an absent value, a malformed one, or a date that does not exist (`2027-02-31`).
 */
export const parseIsoDate = (value?: string): Date | null => {
  const match = value ? ISO_DATE_PATTERN.exec(value) : null;

  if (!match) {
    return null;
  }

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);

  const isExistingDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

  return isExistingDate ? date : null;
};

/** Writes the local year, month and day of `date` as `YYYY-MM-DD`. */
export const formatIsoDate = (date: Date): string => {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
