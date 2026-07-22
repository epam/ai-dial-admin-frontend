import { DialApplicationScheme } from '@/src/models/dial/application';
import { describe, expect, test } from 'vitest';
import { getResourceReadOnlyValues } from '../utils';

describe('getResourceReadOnlyValues', () => {
  test('should return the value and readonly flag when appRunner is provided and the snake_cased key maps to an app runner key', () => {
    const mockAppRunner: DialApplicationScheme = {
      'dial:applicationTypeRateEndpoint': 'Some value for rate endpoint',
    };

    const result = getResourceReadOnlyValues('rate_endpoint', mockAppRunner);

    expect(result.value).toBe('Some value for rate endpoint');
    expect(result.isReadonly).toBe(true);
  });

  test('should map the snake_cased assistant attachments key to its camelCased app runner key', () => {
    const mockAppRunner: DialApplicationScheme = {
      'dial:applicationTypeAssistantAttachmentsInRequestSupported': true,
    };

    const result = getResourceReadOnlyValues('assistant_attachments_in_request_supported', mockAppRunner);

    expect(result.value).toBe(true);
    expect(result.isReadonly).toBe(true);
  });

  test('should return empty value and readonly flag false when appRunner is undefined', () => {
    const result = getResourceReadOnlyValues('rate_endpoint');

    expect(result.value).toBeUndefined();
    expect(result.isReadonly).toBe(false);
  });

  test('should return empty value and readonly flag false when the key does not exist in the resource runner map', () => {
    const mockAppRunner: DialApplicationScheme = {
      'dial:applicationTypeRateEndpoint': 'Some value for rate endpoint',
    };

    const result = getResourceReadOnlyValues('non_existing_key', mockAppRunner);

    expect(result.value).toBeUndefined();
    expect(result.isReadonly).toBe(false);
  });

  test('should not map the camelCased key since resource features are snake_cased', () => {
    const mockAppRunner: DialApplicationScheme = {
      'dial:applicationTypeRateEndpoint': 'Some value for rate endpoint',
    };

    const result = getResourceReadOnlyValues('rateEndpoint', mockAppRunner);

    expect(result.value).toBeUndefined();
    expect(result.isReadonly).toBe(false);
  });

  test('should return readonly flag true but empty value when appRunner does not contain the value for the key', () => {
    const mockAppRunner: DialApplicationScheme = {
      'dial:applicationTypeRateEndpoint': undefined,
    };

    const result = getResourceReadOnlyValues('rate_endpoint', mockAppRunner);

    expect(result.value).toBeUndefined();
    expect(result.isReadonly).toBe(true);
  });
});
