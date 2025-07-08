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
  const date = new Date(value);

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
  const date = new Date(value);

  return date.toLocaleDateString();
};
