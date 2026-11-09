import { describe, expect, test } from 'vitest';

import { getCopyLinkId } from '../copy-link-id';

describe('getCopyLinkId', () => {
  test('appends _copy', () => {
    expect(getCopyLinkId('docs', ['docs'])).toBe('docs_copy');
  });

  test('numbers further copies from 2', () => {
    expect(getCopyLinkId('docs', ['docs', 'docs_copy'])).toBe('docs_copy2');
    expect(getCopyLinkId('docs', ['docs', 'docs_copy', 'docs_copy2'])).toBe('docs_copy3');
  });

  test('skips taken numbers only', () => {
    expect(getCopyLinkId('docs', ['docs', 'docs_copy', 'docs_copy3'])).toBe('docs_copy2');
  });
});
