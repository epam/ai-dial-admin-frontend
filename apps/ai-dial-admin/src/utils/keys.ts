import { KeysI18nKey } from '@/src/constants/i18n';
import { DialKey } from '@/src/models/dial/key';
import { KeyStatus, ValidityPeriods } from '@/src/types/key';

const oneDayInMs = 1000 * 60 * 60 * 24;
const sevenDaysInMs = 7 * oneDayInMs;

/**
 * Check current date and key expire date to generate status
 *
 * @param {DialKey} key - DialKey
 * @param {(t: string, param?: Record<string, number>) => string} t - function for translate
 * @returns {{ status: string; title: string }} - object with status and translated title
 */
export const getKeyStatus = (
  key: DialKey,
  t: (t: string, param?: Record<string, number>) => string,
): { status: string; title: string } => {
  const expireTime = key.expiresAt as number;
  const currentTime = new Date().getTime();
  if (!key.roles || key.roles?.length === 0) {
    return {
      status: KeyStatus.NO_ROLES,
      title: t(KeysI18nKey.NoRoles),
    };
  }
  if (expireTime < currentTime) {
    return {
      status: KeyStatus.EXPIRED,
      title: t(KeysI18nKey.Expired),
    };
  }
  const diff = expireTime - currentTime;

  if (diff < sevenDaysInMs) {
    return {
      status: KeyStatus.ALMOST_EXPIRED,
      title: t(KeysI18nKey.AlmostExpired, { number: Math.floor(diff / oneDayInMs) }),
    };
  }
  return {
    status: KeyStatus.VALID,
    title: t(KeysI18nKey.Valid),
  };
};

/**
 * Calculate date of expiration based on provided period of time
 *
 * @param {string} period - time period
 * @returns {number} - timestamp of expiration date
 */
export const calculateExpirationDate = (period: string): number => {
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

  return now.getTime();
};
