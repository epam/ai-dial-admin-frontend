/**
 * Format date to MM.DD.YYYY HH:mm
 *
 * @param {?number} [timestamp] - date in milliseconds
 * @returns {string} - formatted string
 */
export const formatTimestampToDate = (timestamp?: number): string => {
  if (!timestamp) {
    return '';
  }
  const date = new Date(timestamp);

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${month}.${day}.${year} ${hours}:${minutes}`;
};

/**
 * Returns the sum of two numbers.
 * @param {string} date - Date in UTC format: '1970-01-01T00:00:00Z'.
 * @returns {string} Date string in format: 'DD/MM HH:mm'.
 */
export const formatDateToLocalTime = (date: string): string => {
  return new Date(date).toLocaleString(undefined, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};
