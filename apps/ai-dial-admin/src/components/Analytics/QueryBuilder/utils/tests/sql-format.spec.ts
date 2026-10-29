import { describe, expect, test } from 'vitest';

import { formatSql } from '@/src/components/Analytics/QueryBuilder/utils/sql-format';

describe('formatSql', () => {
  test('reformats a query onto one clause per line', () => {
    expect(formatSql('SELECT * FROM dial_usage_log WHERE request_time >= 0')).toBe(
      'SELECT\n  *\nFROM\n  dial_usage_log\nWHERE\n  request_time >= 0',
    );
  });

  test('keeps a function call attached to its parentheses', () => {
    expect(formatSql("SELECT count(*) FROM t WHERE ts >= now() - INTERVAL '7' DAY")).toBe(
      "SELECT\n  count(*)\nFROM\n  t\nWHERE\n  ts >= now() - INTERVAL '7' DAY",
    );
  });

  test('returns the original text unchanged on a formatting failure', () => {
    expect(formatSql('SELECT (')).toBe('SELECT (');
  });

  test('returns an empty string as-is', () => {
    expect(formatSql('')).toBe('');
  });
});
