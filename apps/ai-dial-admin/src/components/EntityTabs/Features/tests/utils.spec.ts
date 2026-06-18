import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import {
  applicationSwitchGroups,
  applicationTextFeatures,
  modelsSwitchGroups,
  modelsTextFeatures,
} from '../constants';
import { getReadOnlyValues, getSwitchGroups, getTextControls } from '../utils';
import { DialApplicationScheme } from '@/src/models/dial/application';

describe('getSwitchGroups', () => {
  test('returns modelsSwitchGroups for Models route', () => {
    expect(getSwitchGroups(ApplicationRoute.Models)).toEqual(modelsSwitchGroups);
  });

  test('returns applicationSwitchGroups for Applications route', () => {
    expect(getSwitchGroups(ApplicationRoute.Applications)).toEqual(applicationSwitchGroups);
  });

  test('returns applicationSwitchGroups for Asset Application route', () => {
    expect(getSwitchGroups(ApplicationRoute.AssetsApplications)).toEqual(applicationSwitchGroups);
  });

  test('returns empty array for unknown route', () => {
    expect(getSwitchGroups(ApplicationRoute.Keys)).toEqual([]);
  });

  test('every group has a title and at least one key', () => {
    for (const groups of [modelsSwitchGroups, applicationSwitchGroups]) {
      for (const group of groups) {
        expect(group.title).toBeTruthy();
        expect(group.keys.length).toBeGreaterThan(0);
      }
    }
  });

  test('modelsSwitchGroups contains new feature keys in Sampling group', () => {
    const samplingGroup = modelsSwitchGroups[0];
    expect(samplingGroup.keys).toContain('customTemperatureSupported');
    expect(samplingGroup.keys).toContain('maxTokensSupported');
    expect(samplingGroup.keys).toContain('maxCompletionTokensSupported');
  });

  test('applicationSwitchGroups contains new feature keys in Sampling group', () => {
    const samplingGroup = applicationSwitchGroups[0];
    expect(samplingGroup.keys).toContain('customTemperatureSupported');
    expect(samplingGroup.keys).toContain('maxTokensSupported');
    expect(samplingGroup.keys).toContain('maxCompletionTokensSupported');
  });

  test('modelsSwitchGroups has Caching group, applicationSwitchGroups does not', () => {
    const modelsTitles = modelsSwitchGroups.map((g) => g.title);
    const appTitles = applicationSwitchGroups.map((g) => g.title);
    expect(modelsTitles).toContain('Features.Groups.Caching');
    expect(appTitles).not.toContain('Features.Groups.Caching');
  });

  test('applicationSwitchGroups Session group includes consentRequired, models does not', () => {
    const modelsSession = modelsSwitchGroups.find((g) => g.title === 'Features.Groups.SessionAccess');
    const appSession = applicationSwitchGroups.find((g) => g.title === 'Features.Groups.SessionAccess');
    expect(modelsSession?.keys).not.toContain('consentRequired');
    expect(appSession?.keys).toContain('consentRequired');
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
