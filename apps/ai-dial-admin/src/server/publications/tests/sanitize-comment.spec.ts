import { describe, expect, test } from 'vitest';
import { sanitizeComment } from '../sanitize-comment';

describe('Server :: Publications :: sanitizeComment', () => {
  test('removes tags but keeps text', () => {
    expect(sanitizeComment('<b>Looks good</b>')).toBe('Looks good');
    expect(sanitizeComment('Please <i>revise</i> the title')).toBe('Please revise the title');
  });

  test('removes script and style blocks with their content', () => {
    expect(sanitizeComment('ok<script>alert(1)</script> done')).toBe('okalert(1) done');
    expect(sanitizeComment('a<style>.x{color:red}</style>b')).toBe('a.x{color:red}b');
  });

  test('decodes common entities', () => {
    expect(sanitizeComment('Tom &amp; Jerry')).toBe('Tom & Jerry');
    expect(sanitizeComment('&lt;not a tag&gt;')).toBe('<not a tag>');
  });

  test('collapses whitespace and trims', () => {
    expect(sanitizeComment('  too    many   spaces  ')).toBe('too many spaces');
  });

  test('handles empty / undefined input', () => {
    expect(sanitizeComment('')).toBe('');
    expect(sanitizeComment(undefined)).toBe('');
  });
});
