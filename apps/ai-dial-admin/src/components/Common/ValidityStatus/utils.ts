import { ValidityStatusI18nKey } from '@/src/constants/i18n';
import { ValidityStatus } from '@/src/types/key';

/**
 * Get color for key status component
 *
 * @param {string} status - key status
 * @param {string} theme - current theme
 * @returns {string} - tailwind background color class
 */
export const getColorClassName = (status: string, theme: string): string => {
  if (status === ValidityStatus.VALID) {
    return 'bg-accent-secondary';
  }

  return theme === 'dark' ? 'bg-red-400' : 'bg-red-800';
};

export const getValidityStatus = (valid: boolean | undefined, t: (t: string) => string) => {
  if (valid) {
    return {
      status: ValidityStatus.VALID,
      title: t(ValidityStatusI18nKey.Valid),
    };
  }

  return {
    status: ValidityStatus.INVALID,
    title: t(ValidityStatusI18nKey.Invalid),
  };
};
