import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DialApplicationScheme } from '@/src/models/dial/application';
import { AppRunnerOrigin } from '../models';
import { resolveAppRunnerScheme } from '../resolve-app-runner';

vi.mock('@/src/app/[lang]/application-runners/actions', () => ({
  getResolvedApplicationScheme: vi.fn(),
}));

vi.mock('@/src/app/[lang]/platform-app-runners/actions', () => ({
  getResolvedRunnerSchema: vi.fn(),
  getRunner: vi.fn(),
}));

import { getResolvedApplicationScheme } from '@/src/app/[lang]/application-runners/actions';
import { getResolvedRunnerSchema, getRunner } from '@/src/app/[lang]/platform-app-runners/actions';

const configRunner = { $id: 'urn:runner:config', origin: AppRunnerOrigin.Config } as DialApplicationScheme;

const platformRunner = {
  $id: 'http://asdqwe',
  origin: AppRunnerOrigin.Platform,
  path: 'http%3A%2F%2Fasdqwe',
} as unknown as DialApplicationScheme;

describe('resolveAppRunnerScheme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns an empty result for no runner', async () => {
    const result = await resolveAppRunnerScheme(undefined);

    expect(result).toEqual({});
    expect(getResolvedApplicationScheme).not.toHaveBeenCalled();
    expect(getResolvedRunnerSchema).not.toHaveBeenCalled();
    expect(getRunner).not.toHaveBeenCalled();
  });

  test('resolves a Config runner via the admin BE, unchanged on success', async () => {
    const scheme = { $id: 'urn:runner:config', properties: {} };
    vi.mocked(getResolvedApplicationScheme).mockResolvedValue({ success: true, response: { schema: scheme } });

    const result = await resolveAppRunnerScheme(configRunner);

    expect(getResolvedApplicationScheme).toHaveBeenCalledWith('urn:runner:config');
    expect(getRunner).not.toHaveBeenCalled();
    expect(result.runner).toBe(configRunner);
    expect(result.scheme).toBe(scheme);
  });

  test('falls back to the Config runner itself when the admin BE resolve fails', async () => {
    vi.mocked(getResolvedApplicationScheme).mockResolvedValue({ success: false });

    const result = await resolveAppRunnerScheme(configRunner);

    expect(result.runner).toBe(configRunner);
    expect(result.scheme).toBe(configRunner);
  });

  test('resolves a Platform runner against its content $id, not the picker option $id', async () => {
    const detail = { $id: 'http://asdqwe/edited', path: 'http%3A%2F%2Fasdqwe' };
    const scheme = { $id: 'http://asdqwe/edited', properties: {} };
    vi.mocked(getRunner).mockResolvedValue({ success: true, response: detail });
    vi.mocked(getResolvedRunnerSchema).mockResolvedValue({ success: true, response: scheme });

    const result = await resolveAppRunnerScheme(platformRunner);

    expect(getRunner).toHaveBeenCalledWith('http%3A%2F%2Fasdqwe', '*');
    expect(getResolvedRunnerSchema).toHaveBeenCalledWith('http://asdqwe/edited');
    expect(getResolvedApplicationScheme).not.toHaveBeenCalled();
    expect(result.runner).toBe(detail);
    expect(result.scheme).toBe(scheme);
  });

  test('falls back to the picker option when the content fetch fails', async () => {
    vi.mocked(getRunner).mockResolvedValue({ success: false });
    vi.mocked(getResolvedRunnerSchema).mockResolvedValue({ success: false });

    const result = await resolveAppRunnerScheme(platformRunner);

    expect(getResolvedRunnerSchema).toHaveBeenCalledWith('http://asdqwe');
    expect(result.runner).toBe(platformRunner);
    expect(result.scheme).toBe(platformRunner);
  });

  test('falls back to the (possibly corrected) runner when the resolved-schema call fails', async () => {
    const detail = { $id: 'http://asdqwe/edited', path: 'http%3A%2F%2Fasdqwe' };
    vi.mocked(getRunner).mockResolvedValue({ success: true, response: detail });
    vi.mocked(getResolvedRunnerSchema).mockResolvedValue({ success: false });

    const result = await resolveAppRunnerScheme(platformRunner);

    expect(result.runner).toBe(detail);
    expect(result.scheme).toBe(detail);
  });
});
