import { describe, expect, test } from 'vitest';

import { ConfigFileReadResult } from '@/src/models/dial/config-file';
import { ConfigEntityOrigin, ConfigFileEntityType, ConfigFileFailureReason } from '@/src/types/config-file-entity';
import { getConfigEntityReference, unionConfigEntityOptions } from '@/src/utils/config-entities/options';

const ok = (names: string[]): ConfigFileReadResult<string[]> => ({ success: true, data: names });

const failed = (reason = ConfigFileFailureReason.RequestFailed): ConfigFileReadResult<string[]> => ({
  success: false,
  failure: { reason, status: 500 },
});

describe('unionConfigEntityOptions', () => {
  test('offers both populations, platform options first', () => {
    const result = unionConfigEntityOptions(ok(['api-one']), ok(['file-one']));

    expect(result.success).toBe(true);
    expect(result.success && result.data.options).toEqual([
      { name: 'api-one', origin: ConfigEntityOrigin.Api },
      { name: 'file-one', origin: ConfigEntityOrigin.ConfigFile },
    ]);
    expect(result.success && result.data.failures).toEqual([]);
  });

  test('collapses a name present in both populations to a single platform-origin option', () => {
    const result = unionConfigEntityOptions(ok(['shared']), ok(['shared']));

    const options = result.success ? result.data.options : [];
    expect(options).toHaveLength(1);
    expect(options[0]).toEqual({ name: 'shared', origin: ConfigEntityOrigin.Api });
  });

  test('collapses duplicates within a single population', () => {
    const result = unionConfigEntityOptions(ok(['dup', 'dup']), ok([]));

    expect(result.success && result.data.options).toEqual([{ name: 'dup', origin: ConfigEntityOrigin.Api }]);
  });

  test('offers the surviving population and reports the failure when the config-file read fails', () => {
    const result = unionConfigEntityOptions(ok(['api-one']), failed());

    expect(result.success && result.data.options).toEqual([{ name: 'api-one', origin: ConfigEntityOrigin.Api }]);
    expect(result.success && result.data.failures).toHaveLength(1);
  });

  test('offers the surviving population and reports the failure when the metadata read fails', () => {
    const result = unionConfigEntityOptions(failed(), ok(['file-one']));

    expect(result.success && result.data.options).toEqual([
      { name: 'file-one', origin: ConfigEntityOrigin.ConfigFile },
    ]);
    expect(result.success && result.data.failures).toHaveLength(1);
  });

  test('distinguishes a successful empty union from a total failure', () => {
    const empty = unionConfigEntityOptions(ok([]), ok([]));
    expect(empty.success && empty.data.options).toEqual([]);

    const both = unionConfigEntityOptions(failed(), failed());
    expect(both.success).toBe(false);
  });
});

describe('getConfigEntityReference', () => {
  // Asserted as literal strings on purpose: comparing against the helper that produced them would
  // pass for any consistent-but-wrong form, and a wrong form is a save Core rejects at write time.
  test('references a short-name-keyed entity by bare name from either origin', () => {
    expect(
      getConfigEntityReference(
        { name: 'default', origin: ConfigEntityOrigin.ConfigFile },
        ConfigFileEntityType.Interceptors,
      ),
    ).toBe('default');
    expect(
      getConfigEntityReference({ name: 'default', origin: ConfigEntityOrigin.Api }, ConfigFileEntityType.Interceptors),
    ).toBe('default');
  });

  test('references every short-name-keyed type by bare name from the API population', () => {
    expect(
      getConfigEntityReference({ name: 'gpt-4', origin: ConfigEntityOrigin.Api }, ConfigFileEntityType.Models),
    ).toBe('gpt-4');
    expect(
      getConfigEntityReference({ name: 'admin', origin: ConfigEntityOrigin.Api }, ConfigFileEntityType.Roles),
    ).toBe('admin');
    expect(
      getConfigEntityReference({ name: 'my-app', origin: ConfigEntityOrigin.Api }, ConfigFileEntityType.Applications),
    ).toBe('my-app');
    expect(
      getConfigEntityReference({ name: 'my-toolset', origin: ConfigEntityOrigin.Api }, ConfigFileEntityType.Toolsets),
    ).toBe('my-toolset');
  });

  test('references a route by bare name from the config-file population and canonical id from the API population', () => {
    expect(
      getConfigEntityReference(
        { name: 'my-route', origin: ConfigEntityOrigin.ConfigFile },
        ConfigFileEntityType.Routes,
      ),
    ).toBe('my-route');
    expect(
      getConfigEntityReference({ name: 'my-route', origin: ConfigEntityOrigin.Api }, ConfigFileEntityType.Routes),
    ).toBe('routes/platform/my-route');
  });

  test('references a key by bare name from the config-file population and canonical id from the API population', () => {
    expect(
      getConfigEntityReference({ name: 'my-key', origin: ConfigEntityOrigin.ConfigFile }, ConfigFileEntityType.Keys),
    ).toBe('my-key');
    expect(
      getConfigEntityReference({ name: 'my-key', origin: ConfigEntityOrigin.Api }, ConfigFileEntityType.Keys),
    ).toBe('keys/platform/my-key');
  });
});

describe('a name containing the canonical separator', () => {
  test('is not mistaken for a canonical id', () => {
    const trap = 'interceptors/platform/looks-canonical';
    const result = unionConfigEntityOptions(ok([]), ok([trap]));
    const options = result.success ? result.data.options : [];

    expect(options).toEqual([{ name: trap, origin: ConfigEntityOrigin.ConfigFile }]);
    // Stored as the bare name it is, so it resolves to that config-file entity — not to an API-written
    // `looks-canonical` that may also exist.
    expect(getConfigEntityReference(options[0], ConfigFileEntityType.Interceptors)).toBe(trap);
  });

  test('collapses to a single reference when the same name exists in both populations', () => {
    const result = unionConfigEntityOptions(ok(['shared']), ok(['shared']));
    const options = result.success ? result.data.options : [];

    expect(options.map((option) => getConfigEntityReference(option, ConfigFileEntityType.Interceptors))).toEqual([
      'shared',
    ]);
  });
});

describe('total failure', () => {
  test('reports both reasons so a permissions problem is not hidden', () => {
    const apiWritten = {
      success: false as const,
      failure: { reason: ConfigFileFailureReason.RequestFailed, errorMessage: 'metadata unreadable' },
    };
    const configFile = {
      success: false as const,
      failure: { reason: ConfigFileFailureReason.RequestFailed, status: 403, errorMessage: 'forbidden' },
    };

    const result = unionConfigEntityOptions(apiWritten, configFile);

    expect(result.success).toBe(false);
    expect(!result.success && result.failure.errorMessage).toContain('metadata unreadable');
    expect(!result.success && result.failure.errorMessage).toContain('forbidden');
  });

  test('drops empty names from a population', () => {
    const result = unionConfigEntityOptions(ok(['', 'real']), ok([]));

    expect(result.success && result.data.options).toEqual([{ name: 'real', origin: ConfigEntityOrigin.Api }]);
  });
});
