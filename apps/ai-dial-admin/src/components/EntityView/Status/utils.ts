import { ValidityStatusI18nKey } from '@/src/constants/i18n';
import { ValidityState } from '@/src/models/dial/base-entity';
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

  // // TODO: check after supporting API
  // if (status === ValidityStatus.ALMOST_EXPIRED) {
  //   return theme === 'dark' ? 'bg-orange-400' : 'bg-orange-800';
  // }

  return theme === 'dark' ? 'bg-red-400' : 'bg-red-800';
};

export const getValidityStatus = (validityState: ValidityState | undefined, t: (t: string) => string) => {
  if (validityState?.valid) {
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
