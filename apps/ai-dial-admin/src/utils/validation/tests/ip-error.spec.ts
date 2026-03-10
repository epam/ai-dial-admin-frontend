import { describe, expect, test } from 'vitest';
import { ErrorType } from '@/src/types/error-type';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { isValidIpAddress, isValidIpMask, getIpAddressError, getIPMaskError } from '../ip-error';

describe('isValidIpAddress', () => {
  test('returns true for valid IPv4 or IPv6 addresses', () => {
    expect(isValidIpAddress('192.168.1.1')).toBe(true);
    expect(isValidIpAddress('2001:0DB8:AA10:0001:0000:0000:0000:00FB')).toBe(true);
  });

  test('returns false for invalid IPv4 or IPv6 addresses', () => {
    expect(isValidIpAddress('256.168.1.1')).toBe(false);
    expect(isValidIpAddress('192.168.1')).toBe(false);
    expect(isValidIpAddress('192.168.1.1.1')).toBe(false);
    expect(isValidIpAddress('192.-1.1.1')).toBe(false);
    expect(isValidIpAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334:1234')).toBe(false);
    expect(isValidIpAddress('2001:0db8:85a3:0000:8a2e:0370')).toBe(false);
    expect(isValidIpAddress('2001:0db8:85a3:0000:0000:8a2e:0370:zzzz')).toBe(false);
    expect(isValidIpAddress('2001:0db8::85a3::7334')).toBe(false);
  });
});

describe('isValidIpMask', () => {
  test('returns true for valid Mask', () => {
    const min = 0;
    const max = 24;
    expect(isValidIpMask(10, min, max)).toBe(true);
    expect(isValidIpMask(0, min, max)).toBe(true);
    expect(isValidIpMask(24, min, max)).toBe(true);
  });

  test('returns false for invalid Mask', () => {
    const min = 0;
    const max = 24;
    expect(isValidIpMask(-1, min, max)).toBe(false);
    expect(isValidIpMask(25, min, max)).toBe(false);
    expect(isValidIpMask(NaN, min, max)).toBe(false);
  });
});

describe('getIpAddressError', () => {
  const t = (str: string) => str;

  test('returns an error for empty IP', () => {
    const error = getIpAddressError(void 0, t, true);

    expect(error?.type).toEqual(ErrorType.EMPTY);
    expect(error?.text).toEqual(ErrorI18nKey.EmptyIpRangeField);
  });

  test('returns an error for invalid IP', () => {
    const error = getIpAddressError('192.168.1', t);

    expect(error?.type).toEqual(ErrorType.INVALID);
    expect(error?.text).toEqual(ErrorI18nKey.InvalidIpAddress);
  });

  test('returns null for valid IP', () => {
    const error = getIpAddressError('192.168.1.1', t);

    expect(error).toBeNull();
  });
});

describe('getIPMaskError', () => {
  const t = (str: string) => str;
  const min = 0;
  const max = 24;

  test('returns an error for empty Mask', () => {
    const error = getIPMaskError(void 0, t, true, min, max);

    expect(error?.type).toEqual(ErrorType.EMPTY);
    expect(error?.text).toEqual(ErrorI18nKey.EmptyIpRangeField);
  });

  test('returns an error for invalid Mask', () => {
    const error = getIPMaskError(-1, t, true, min, max);

    expect(error?.type).toEqual(ErrorType.INVALID);
    expect(error?.text).toEqual(ErrorI18nKey.MinMaxMask);
  });

  test('returns null for valid IP', () => {
    const error = getIPMaskError(10, t, true, min, max);

    expect(error).toBeNull();
  });
});
