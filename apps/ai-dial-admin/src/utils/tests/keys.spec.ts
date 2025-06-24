import { KeysI18nKey } from '@/src/constants/i18n';
import { DialKey } from '@/src/models/dial/key';
import { KeyStatus, ValidityPeriods } from '@/src/types/key';
import { calculateExpirationDate, getKeyStatus } from '@/src/utils/keys';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

describe('Utils :: date :: getKeyStatus', () => {
  const mockTranslate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test.skip('returns NO_ROLES if roles are missing or empty', () => {
    const key: Partial<DialKey> = {
      expiresAt: Date.now() + 10000000,
      roles: [],
    };

    mockTranslate.mockReturnValue('No Roles');

    const result = getKeyStatus(key as DialKey, mockTranslate);
    expect(result.status).toBe(KeyStatus.NO_ROLES);
    expect(result.title).toBe('No Roles');
    expect(mockTranslate).toHaveBeenCalledWith(KeysI18nKey.NoRoles);
  });

  test.skip('returns EXPIRED if expiresAt is in the past', () => {
    const key: Partial<DialKey> = {
      expiresAt: Date.now() - 1000,
      roles: ['admin'],
    };

    mockTranslate.mockReturnValue('Expired');

    const result = getKeyStatus(key as DialKey, mockTranslate);
    expect(result.status).toBe(KeyStatus.EXPIRED);
    expect(result.title).toBe('Expired');
    expect(mockTranslate).toHaveBeenCalledWith(KeysI18nKey.Expired);
  });

  test.skip('returns ALMOST_EXPIRED if expires in less than 7 days', () => {
    const twoDaysFromNow = Date.now() + 2 * 24 * 60 * 60 * 1000;
    const key: Partial<DialKey> = {
      expiresAt: twoDaysFromNow,
      roles: ['admin'],
    };

    mockTranslate.mockReturnValue('Expires in 2 days');

    const result = getKeyStatus(key as DialKey, mockTranslate);
    expect(result.status).toBe(KeyStatus.ALMOST_EXPIRED);
    expect(result.title).toBe('Expires in 2 days');
    expect(mockTranslate).toHaveBeenCalledWith(KeysI18nKey.AlmostExpired, {
      number: 2,
    });
  });

  test.skip('returns VALID if expires in more than 7 days', () => {
    const tenDaysFromNow = Date.now() + 10 * 24 * 60 * 60 * 1000;
    const key: Partial<DialKey> = {
      expiresAt: tenDaysFromNow,
      roles: ['admin'],
    };

    mockTranslate.mockReturnValue('Valid');

    const result = getKeyStatus(key as DialKey, mockTranslate);
    expect(result.status).toBe(KeyStatus.VALID);
    expect(result.title).toBe('Valid');
    expect(mockTranslate).toHaveBeenCalledWith(KeysI18nKey.Valid);
  });
});

describe('Utils :: date :: calculateExpirationDate', () => {
  const fixedDate = new Date(Date.UTC(2025, 0, 1));

  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(fixedDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test.skip('returns timestamp + 1 day for DAY period', () => {
    const result = calculateExpirationDate(ValidityPeriods.DAY);
    const expected = Date.UTC(2025, 0, 2);
    expect(result).toBe(expected);
  });

  test.skip('returns timestamp + 7 days for WEEK period', () => {
    const result = calculateExpirationDate(ValidityPeriods.WEEK);
    const expected = Date.UTC(2025, 0, 8);
    expect(result).toBe(expected);
  });

  test.skip('returns timestamp + 1 month for MONTH period', () => {
    const result = calculateExpirationDate(ValidityPeriods.MONTH);
    const expected = Date.UTC(2025, 1, 1);
    expect(result).toBe(expected);
  });

  test.skip('returns timestamp + 3 months for THREE_MONTHS period', () => {
    const result = calculateExpirationDate(ValidityPeriods.THREE_MONTHS);
    const expected = Date.UTC(2025, 3, 1);
    expect(result).toBe(expected);
  });

  test.skip('returns timestamp + 6 months for SIX_MONTHS period', () => {
    const result = calculateExpirationDate(ValidityPeriods.SIX_MONTHS);
    const expected = Date.UTC(2025, 6, 1);
    expect(result).toBe(expected);
  });

  test.skip('returns timestamp + 1 year for YEAR period', () => {
    const result = calculateExpirationDate(ValidityPeriods.YEAR);
    const expected = Date.UTC(2026, 0, 1);
    expect(result).toBe(expected);
  });
});
