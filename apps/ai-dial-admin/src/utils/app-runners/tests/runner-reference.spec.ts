import { describe, expect, it } from 'vitest';

import { fromRunnerReference, toRunnerReference } from '@/src/utils/app-runners/runner-reference';

describe('runner-reference', () => {
  it('builds the canonical reference a Core-side review named verbatim', () => {
    expect(toRunnerReference('http://asdqwe')).toBe('schemas/platform/http%3A%2F%2Fasdqwe');
  });

  it('encodes the separators that would otherwise read as path segments', () => {
    expect(toRunnerReference('https://host/custom_application_schemas/my-runner')).toBe(
      'schemas/platform/https%3A%2F%2Fhost%2Fcustom_application_schemas%2Fmy-runner',
    );
  });

  it('round trips ids containing : and /', () => {
    const id = 'https://dial.epam.com/custom_application_schemas/chart';
    expect(fromRunnerReference(toRunnerReference(id))).toBe(id);
  });

  it('does not mistake a bare entity $id for a reference', () => {
    expect(fromRunnerReference('http://asdqwe')).toBeUndefined();
  });

  it('returns undefined for an empty value rather than an empty id', () => {
    expect(fromRunnerReference('')).toBeUndefined();
  });
});
