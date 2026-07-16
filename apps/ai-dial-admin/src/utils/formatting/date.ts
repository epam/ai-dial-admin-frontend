/**
 * Normalize a datetime value into a Date. Numeric strings (millisecond timestamps
 * serialized as strings) are converted to numbers so they are not misparsed as date strings.
 *
 * @param {number | string} value - datetime in milliseconds or iso string
 * @returns {Date} - parsed date
 */
const toDate = (value: number | string): Date => {
  const normalized = typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value)) ? Number(value) : value;

  return new Date(normalized);
};

/**
 * Format date time to user local time format.
 *
 * @param {?number | string} [value] - datetime in milliseconds and iso string
 * @returns {string} - formatted datetime string
 */
export const formatDateTimeToLocalString = (value?: number | string): string => {
  if (!value) {
    return '';
  }
  const date = toDate(value);

  return date.toLocaleString();
};

/**
 * Format date to user local time format.
 *
 * @param {?number | string} [value] - datetime in milliseconds and iso string
 * @returns {string} - formatted date string
 */
export const formatDateToLocalString = (value?: number | string): string => {
  if (!value) {
    return '';
  }
  const date = toDate(value);

  return date.toLocaleDateString();
};

/**
 * Coerce a datetime cell value into a Date for agDateColumnFilter comparisons.
 *
 * @param {?number | string | null} [value] - datetime in milliseconds or iso string
 * @returns {?Date} parsed date, or null when missing/invalid
 */
export const toDateOrNull = (value?: number | string | null): Date | null => {
  if (value == null || value === '') {
    return null;
  }

  const date = toDate(value);

  return Number.isNaN(date.getTime()) ? null : date;
};
