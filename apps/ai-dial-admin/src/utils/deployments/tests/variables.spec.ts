import { describe, expect, test } from 'vitest';
import { getValueByMountType, toBase64Value } from '../variables';
import { MOUNT_TYPE } from '@/src/types/deployments/variables';

describe('variables utils', () => {
  describe('toBase64Value', () => {
    test('converts string to base64', () => {
      const input = 'hello world';
      const expected = Buffer.from(input).toString('base64');
      expect(toBase64Value(input)).toBe(expected);
    });

    test('handles empty string', () => {
      expect(toBase64Value('')).toBe('');
    });
  });

  describe('getValueByMountType', () => {
    test('returns base64 encoded value for SECURE_FILE mount type', () => {
      const value = 'secret';
      const expected = Buffer.from(value).toString('base64');
      expect(getValueByMountType(value, MOUNT_TYPE.SECURE_FILE)).toBe(expected);
    });

    test('returns original value for other mount types', () => {
      const value = 'plain text';
      expect(getValueByMountType(value, MOUNT_TYPE.CONTENT)).toBe(value);
    });
  });
});
