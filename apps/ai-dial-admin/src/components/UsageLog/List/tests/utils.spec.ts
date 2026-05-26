import { describe, expect, test } from 'vitest';

import { buildDayQueue, tagRowsWithIds } from '../utils';

describe('UsageLog/List/utils :: buildDayQueue', () => {
  test('desc: returns newest-first windows across a multi-day range', () => {
    const queue = buildDayQueue(
      {
        startDate: new Date('2026-04-01T00:00:00.000Z'),
        endDate: new Date('2026-04-04T00:00:00.000Z'),
      },
      'desc',
    );
    expect(queue.map((w) => [w.startDate.toISOString(), w.endDate.toISOString()])).toEqual([
      ['2026-04-03T00:00:00.000Z', '2026-04-04T00:00:00.000Z'],
      ['2026-04-02T00:00:00.000Z', '2026-04-03T00:00:00.000Z'],
      ['2026-04-01T00:00:00.000Z', '2026-04-02T00:00:00.000Z'],
    ]);
  });

  test('asc: returns oldest-first windows across a multi-day range', () => {
    const queue = buildDayQueue(
      {
        startDate: new Date('2026-04-01T00:00:00.000Z'),
        endDate: new Date('2026-04-04T00:00:00.000Z'),
      },
      'asc',
    );
    expect(queue.map((w) => [w.startDate.toISOString(), w.endDate.toISOString()])).toEqual([
      ['2026-04-01T00:00:00.000Z', '2026-04-02T00:00:00.000Z'],
      ['2026-04-02T00:00:00.000Z', '2026-04-03T00:00:00.000Z'],
      ['2026-04-03T00:00:00.000Z', '2026-04-04T00:00:00.000Z'],
    ]);
  });

  test('asc and desc cover the same windows, in reverse order', () => {
    const range = {
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2026-04-04T00:00:00.000Z'),
    };
    const desc = buildDayQueue(range, 'desc');
    const asc = buildDayQueue(range, 'asc');
    expect(asc).toEqual([...desc].reverse());
  });

  test('empty range returns []', () => {
    const queue = buildDayQueue(
      {
        startDate: new Date('2026-04-01T00:00:00.000Z'),
        endDate: new Date('2026-04-01T00:00:00.000Z'),
      },
      'desc',
    );
    expect(queue).toEqual([]);
  });

  test('inverted range (end before start) returns []', () => {
    const queue = buildDayQueue(
      {
        startDate: new Date('2026-04-02T00:00:00.000Z'),
        endDate: new Date('2026-04-01T00:00:00.000Z'),
      },
      'asc',
    );
    expect(queue).toEqual([]);
  });

  test('sub-day range returns a single window covering the full range', () => {
    const range = {
      startDate: new Date('2026-04-01T06:00:00.000Z'),
      endDate: new Date('2026-04-01T12:00:00.000Z'),
    };
    expect(buildDayQueue(range, 'desc')).toEqual([range]);
    expect(buildDayQueue(range, 'asc')).toEqual([range]);
  });

  test('non-day-aligned range: final asc window is clamped to the end', () => {
    const queue = buildDayQueue(
      {
        startDate: new Date('2026-04-01T00:00:00.000Z'),
        endDate: new Date('2026-04-02T12:00:00.000Z'),
      },
      'asc',
    );
    expect(queue.map((w) => [w.startDate.toISOString(), w.endDate.toISOString()])).toEqual([
      ['2026-04-01T00:00:00.000Z', '2026-04-02T00:00:00.000Z'],
      ['2026-04-02T00:00:00.000Z', '2026-04-02T12:00:00.000Z'],
    ]);
  });
});

describe('UsageLog/List/utils :: tagRowsWithIds', () => {
  test('tags each row with a stringified counter starting from startCounter', () => {
    const result = tagRowsWithIds([{ a: '1' }, { a: '2' }], 5);
    expect(result.tagged).toEqual([
      { a: '1', __rowId: '5' },
      { a: '2', __rowId: '6' },
    ]);
    expect(result.nextCounter).toBe(7);
  });

  test('returns empty list and unchanged counter for no rows', () => {
    const result = tagRowsWithIds([], 0);
    expect(result.tagged).toEqual([]);
    expect(result.nextCounter).toBe(0);
  });
});
