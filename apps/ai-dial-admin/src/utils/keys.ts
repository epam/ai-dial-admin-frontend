import { ValidityPeriods } from '@/src/types/key';

/**
 * Calculate date of expiration based on provided period of time
 *
 * @param {string} period - time period
 * @returns {number} - timestamp of expiration date
 */
export const calculateExpirationDate = (period: string): string => {
  const now = new Date();

  switch (period) {
    case ValidityPeriods.DAY:
      now.setDate(now.getDate() + 1);
      break;
    case ValidityPeriods.WEEK:
      now.setDate(now.getDate() + 7);
      break;
    case ValidityPeriods.MONTH:
      now.setMonth(now.getMonth() + 1);
      break;
    case ValidityPeriods.THREE_MONTHS:
      now.setMonth(now.getMonth() + 3);
      break;
    case ValidityPeriods.SIX_MONTHS:
      now.setMonth(now.getMonth() + 6);
      break;
    case ValidityPeriods.YEAR:
      now.setFullYear(now.getFullYear() + 1);
      break;
  }

  return now.toISOString();
};
