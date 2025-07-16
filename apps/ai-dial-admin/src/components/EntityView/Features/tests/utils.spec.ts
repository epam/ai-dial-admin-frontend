import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import {
  applicationSwitchFeatures,
  applicationTextFeatures,
  modelsSwitchFeatures,
  modelsTextFeatures,
} from '../constants';
import { getSwitchControls, getTextControls } from '../utils';

describe('getSwitchControls', () => {
  test('returns modelsSwitchFeatures for Models route', () => {
    expect(getSwitchControls(ApplicationRoute.Models)).toEqual(modelsSwitchFeatures);
  });

  test('returns applicationSwitchFeatures for Applications route', () => {
    expect(getSwitchControls(ApplicationRoute.Applications)).toEqual(applicationSwitchFeatures);
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

  test('returns empty array for unknown route', () => {
    expect(getTextControls(ApplicationRoute.Keys)).toEqual([]);
  });
});
