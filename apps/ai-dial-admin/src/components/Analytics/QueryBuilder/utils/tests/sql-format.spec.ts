import { describe, expect, test } from 'vitest';

import { formatSql } from '@/src/components/Analytics/QueryBuilder/utils/sql-format';

describe('formatSql', () => {
  test('reformats a query onto one clause per line', () => {
    expect(formatSql('SELECT * FROM dial_usage_log WHERE request_time >= 0')).toBe(
      'SELECT\n  *\nFROM\n  dial_usage_log\nWHERE\n  request_time >= 0',
    );
  });

  test('returns the original text unchanged on a formatting failure', () => {
    expect(formatSql('SELECT (')).toBe('SELECT (');
  });

  test('returns an empty string as-is', () => {
    expect(formatSql('')).toBe('');
  });
});
