import { afterEach, describe, expect, test, vi } from 'vitest';

import { getProjectContextLimits, parseProjectContextExtensions } from '../get-project-context-limits';

describe('parseProjectContextExtensions', () => {
  test('trims, lower-cases, strips leading dots and drops empty entries', () => {
    expect(parseProjectContextExtensions(' .CSV, pdf ,, .Xlsx ')).toEqual(['csv', 'pdf', 'xlsx']);
  });

  test.each([undefined, '', ' , ,'])('falls back to the defaults for %j', (value) => {
    expect(parseProjectContextExtensions(value)).toEqual(['csv', 'pdf', 'xlsx']);
  });
});

describe('getProjectContextLimits', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('uses chat-compatible defaults when nothing is set', () => {
    expect(getProjectContextLimits()).toEqual({
      allowedExtensions: ['csv', 'pdf', 'xlsx'],
      maxFileBytes: 1_048_576,
      maxTotalBytes: 10_485_760,
      maxFiles: 100,
    });
  });

  test('reads overrides from the environment', () => {
    vi.stubEnv('PROJECT_CONTEXT_ALLOWED_EXTENSIONS', 'txt,md');
    vi.stubEnv('PROJECT_CONTEXT_FILE_MAX_BYTES', '500');
    vi.stubEnv('PROJECT_CONTEXT_TOTAL_MAX_BYTES', '9000');

    expect(getProjectContextLimits()).toMatchObject({
      allowedExtensions: ['txt', 'md'],
      maxFileBytes: 500,
      maxTotalBytes: 9000,
    });
  });

  test.each(['abc', '0', '-5', '1.5', ''])('falls back to the default for the byte value %j', (value) => {
    vi.stubEnv('PROJECT_CONTEXT_FILE_MAX_BYTES', value);
    vi.stubEnv('PROJECT_CONTEXT_TOTAL_MAX_BYTES', value);

    expect(getProjectContextLimits()).toMatchObject({ maxFileBytes: 1_048_576, maxTotalBytes: 10_485_760 });
  });
});
