import { describe, expect, test } from 'vitest';
import { toBase64Value, fromBase64Value, encodeVariables, decodeVariables } from '../variables';
import { MOUNT_TYPE, VALUE_TYPE } from '@/src/types/deployments/variables';
import { Container } from '@/src/models/deployments/containers';

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

  describe('fromBase64Value', () => {
    test('converts base64 to string', () => {
      const input = 'aGVsbG8gd29ybGQ='; // 'hello world'
      const expected = 'hello world';
      expect(fromBase64Value(input)).toBe(expected);
    });

    test('handles empty string', () => {
      expect(fromBase64Value('')).toBe('');
    });
  });

  describe('encodeVariables / decodeVariables', () => {
    test('encodes secure_file variable values to base64 and leaves others intact', () => {
      const container: any = {
        metadata: {
          envs: [
            {
              name: 'SECRET_VAR',
              description: 'secret',
              value: { $type: VALUE_TYPE.SIMPLE, value: 'my-secret' },
              mountType: MOUNT_TYPE.SECURE_FILE,
            },
            {
              name: 'PLAIN_VAR',
              description: 'plain',
              value: { $type: VALUE_TYPE.SIMPLE, value: 'plain-value' },
              mountType: MOUNT_TYPE.CONTENT,
            },
          ],
        },
      };

      const encoded = encodeVariables(container as Container);

      expect(encoded.metadata!.envs![0].value!.value).toBe(toBase64Value('my-secret'));
      expect(encoded.metadata!.envs![1].value!.value).toBe('plain-value');
    });

    test('decodes secure_file variable values from base64 and leaves others intact', () => {
      const container = {
        metadata: {
          envs: [
            {
              name: 'SECRET_VAR',
              description: 'secret',
              value: { $type: VALUE_TYPE.SIMPLE, value: toBase64Value('decoded-secret') },
              mountType: MOUNT_TYPE.SECURE_FILE,
            },
            {
              name: 'PLAIN_VAR',
              description: 'plain',
              value: { $type: VALUE_TYPE.SIMPLE, value: 'plain-value' },
              mountType: MOUNT_TYPE.CONTENT,
            },
          ],
        },
      };

      const decoded = decodeVariables(container as Container);

      expect(decoded.metadata!.envs![0].value!.value).toBe('decoded-secret');
      expect(decoded.metadata!.envs![1].value!.value).toBe('plain-value');
    });

    test('encodeVariables and decodeVariables are inverses for secure_file values', () => {
      const original: any = {
        metadata: {
          envs: [
            {
              name: 'SECRET_VAR',
              description: 'secret',
              value: { $type: VALUE_TYPE.SIMPLE, value: 'roundtrip' },
              mountType: MOUNT_TYPE.SECURE_FILE,
            },
          ],
        },
      };

      const encoded = encodeVariables(original as Container);
      const decoded = decodeVariables(encoded as Container);

      expect(decoded.metadata!.envs![0].value!.value).toBe('roundtrip');
    });
  });
});
