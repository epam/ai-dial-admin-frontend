import { describe, expect, test } from 'vitest';

import { extractSql } from '@/src/components/Analytics/QueryBuilder/utils/extract-sql';

describe('extractSql', () => {
  test('returns the SQL from a ```sql-tagged block', () => {
    const content = '```sql\nSELECT 1\n```';
    expect(extractSql(content)).toBe('SELECT 1');
  });

  test('extracts the block from surrounding prose', () => {
    const content =
      'Here is the query you asked for:\n\n```sql\nSELECT a FROM t\nWHERE a > 0\n```\n\n**Note:** trimmed.';
    expect(extractSql(content)).toBe('SELECT a FROM t\nWHERE a > 0');
  });

  test('returns the last block when several are present', () => {
    const content = '```sql\nSELECT 1\n```\nthen\n```sql\nSELECT 2\n```';
    expect(extractSql(content)).toBe('SELECT 2');
  });

  test('falls back to an untagged fenced block when no sql tag exists', () => {
    const content = 'no tag here:\n```\nSELECT untagged\n```';
    expect(extractSql(content)).toBe('SELECT untagged');
  });

  test('prefers a sql-tagged block over an untagged one', () => {
    const content = '```\nnot sql\n```\n```sql\nSELECT real\n```';
    expect(extractSql(content)).toBe('SELECT real');
  });

  test('is case-insensitive on the language tag', () => {
    const content = '```SQL\nSELECT upper\n```';
    expect(extractSql(content)).toBe('SELECT upper');
  });

  test('handles CRLF line endings', () => {
    expect(extractSql('```sql\r\nSELECT crlf\r\n```')).toBe('SELECT crlf');
  });

  test('tolerates an info string after the language tag', () => {
    expect(extractSql('```sql title="q"\nSELECT info\n```')).toBe('SELECT info');
  });

  test('returns null when there is no fenced block', () => {
    expect(extractSql('just prose, no code')).toBeNull();
  });

  test('returns null for empty input', () => {
    expect(extractSql('')).toBeNull();
  });

  test('ignores an empty fenced block', () => {
    expect(extractSql('```sql\n\n```')).toBeNull();
  });
});
