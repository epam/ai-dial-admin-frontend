import { CreateI18nKey } from '@/src/constants/i18n';
import { MAX_NAME_SYMBOLS } from '@/src/constants/validation';
import { FieldError } from '@/src/models/error';
import { ErrorType } from '@/src/types/error-type';
import { KeyStatus } from '@/src/types/key';

/**
 * Check key for already existing key value
 *
 * @param {string} key - DialKey key value
 * @param {?string[]} [keys] - array of existing key values
 * @param {?(str: string) => string} [t] - function for translate
 * @returns {(FieldError | null)} - object with type - representing ErrorType and text - translated error text
 */
export const getErrorForKey = (
  key: string,
  keys?: string[],
  t?: (str: string, param?: Record<string, number>) => string,
): FieldError | null => {
  const isIncludesKey = keys?.includes(key);
  const isWrongLength = key.length > MAX_NAME_SYMBOLS;

  if (isIncludesKey) {
    return {
      type: ErrorType.EXISTING,
      text: t ? t(CreateI18nKey.ErrorKey) : '',
    };
  }

  if (isWrongLength) {
    return {
      type: ErrorType.LENGTH,
      text: t ? t(CreateI18nKey.ErrorLength, { number: MAX_NAME_SYMBOLS }) : '',
    };
  }
  return null;
};

/**
 * Get color for key status component
 *
 * @param {string} status - key status
 * @param {string} theme - current theme
 * @returns {string} - tailwind background color class
 */
export const getColorClass = (status: string, theme: string): string => {
  if (status === KeyStatus.VALID) {
    return 'bg-accent-secondary';
  }
  if (status === KeyStatus.ALMOST_EXPIRED) {
    return theme === 'dark' ? 'bg-orange-400' : 'bg-orange-800';
  }
  return theme === 'dark' ? 'bg-red-400' : 'bg-red-800';
};
