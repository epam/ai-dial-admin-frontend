import { describe, expect, test } from 'vitest';

import { resolveImportDestination } from '../import-destination';

describe('Server :: Assets :: import-destination :: resolveImportDestination', () => {
  test('flatImport drops the original folder structure', () => {
    expect(resolveImportDestination('public/target/', 'public/source/sub/', 'name', '1.0', true)).toBe(
      'public/target/name__1.0',
    );
  });

  test('non-flat import preserves the relative folder structure', () => {
    expect(resolveImportDestination('public/target/', 'public/source/sub/', 'name', '1.0', false)).toBe(
      'public/target/source/sub/name__1.0',
    );
  });

  test('non-flat import with no nested subfolder', () => {
    expect(resolveImportDestination('public/target/', 'public/', 'name', undefined, false)).toBe('public/target/name');
  });
});
