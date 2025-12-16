import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import {
  applicationSwitchFeatures,
  applicationTextFeatures,
  modelsSwitchFeatures,
  modelsTextFeatures,
} from '../constants';
import { getReadOnlyValues, getSwitchControls, getTextControls } from '../utils';
import { DialApplicationScheme } from '@/src/models/dial/application';

describe('getSwitchControls', () => {
  test('returns modelsSwitchFeatures for Models route', () => {
    expect(getSwitchControls(ApplicationRoute.Models)).toEqual(modelsSwitchFeatures);
  });

  test('returns applicationSwitchFeatures for Applications route', () => {
    expect(getSwitchControls(ApplicationRoute.Applications)).toEqual(applicationSwitchFeatures);
  });

  test('returns applicationSwitchFeatures for Asset Application route', () => {
    expect(getSwitchControls(ApplicationRoute.AssetsApplications)).toEqual(applicationSwitchFeatures);
  });

  test('returns empty array for unknown route', () => {
    expect(getSwitchControls(ApplicationRoute.Keys)).toEqual([]);
  });
});

describe('getTextControls', () => {
  test('returns modelsTextFeatures for Models route', () => {
    expect(getTextControls(ApplicationRoute.Models)).toEqual(modelsTextFeatures);
  });

  test('returns applicationTextFeatures for Applications route', () => {
    expect(getTextControls(ApplicationRoute.Applications)).toEqual(applicationTextFeatures);
  });

  test('returns applicationTextFeatures for Asset Application route', () => {
    expect(getTextControls(ApplicationRoute.AssetsApplications)).toEqual(applicationTextFeatures);
  });

  test('returns empty array for unknown route', () => {
    expect(getTextControls(ApplicationRoute.Keys)).toEqual([]);
  });
});

describe('getReadOnlyValues', () => {
  test('should return the correct value and readonly flag when appRunner is provided and key exists in runnerApplicationMap', () => {
    const mockAppRunner: DialApplicationScheme = {
      'dial:applicationTypeRateEndpoint': 'Some value for rate endpoint',
    };

    const result = getReadOnlyValues('rateEndpoint', mockAppRunner);

    expect(result.value).toBe('Some value for rate endpoint');
    expect(result.isReadonly).toBe(true);
  });

  test('should return empty value and readonly flag false when appRunner is undefined', () => {
    const result = getReadOnlyValues('rateEndpoint');

    expect(result.value).toBeUndefined();
    expect(result.isReadonly).toBe(false);
  });

  test('should return empty value and readonly flag false when the key does not exist in runnerApplicationMap', () => {
    const mockAppRunner: DialApplicationScheme = {
      'dial:applicationTypeRateEndpoint': 'Some value for rate endpoint',
    };

    const result = getReadOnlyValues('nonExistingKey', mockAppRunner);

    expect(result.value).toBeUndefined();
    expect(result.isReadonly).toBe(false);
  });

  test('should return empty value and readonly flag false if appRunner does not contain the value for the key', () => {
    const mockAppRunner: DialApplicationScheme = {
      'dial:applicationTypeRateEndpoint': undefined,
    };

    const result = getReadOnlyValues('rateEndpoint', mockAppRunner);

    expect(result.value).toBeUndefined();
    expect(result.isReadonly).toBe(true);
  });

  test('should handle an empty appRunner object gracefully', () => {
    const result = getReadOnlyValues('rateEndpoint', {});

    expect(result.value).toBeUndefined();
    expect(result.isReadonly).toBe(true);
  });
});
