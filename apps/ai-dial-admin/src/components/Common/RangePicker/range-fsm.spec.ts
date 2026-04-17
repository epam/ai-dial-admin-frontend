import { describe, expect, test } from 'vitest';

import { differenceInCalendarDays, hydrate, reduce, toCommit, toDisplayRange, RangeFsmState } from './range-fsm';

const day = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h, 0, 0, 0);

describe('differenceInCalendarDays', () => {
  test('returns 0 for same calendar day regardless of time-of-day', () => {
    expect(differenceInCalendarDays(day(2026, 3, 3, 0), day(2026, 3, 3, 23))).toBe(0);
  });

  test('returns absolute difference in days', () => {
    expect(differenceInCalendarDays(day(2026, 3, 3), day(2026, 3, 5))).toBe(2);
    expect(differenceInCalendarDays(day(2026, 3, 5), day(2026, 3, 3))).toBe(2);
  });

  test('handles month boundaries', () => {
    expect(differenceInCalendarDays(day(2026, 2, 28), day(2026, 3, 2))).toBe(2);
  });
});

describe('reduce', () => {
  const maxDays = 3;

  test('empty + click → single', () => {
    const next = reduce({ kind: 'empty' }, day(2026, 3, 3), maxDays);
    expect(next).toEqual({ kind: 'single', date: day(2026, 3, 3) });
  });

  test('single(A) + click within reach → interval(anchor: A, latest: X)', () => {
    const next = reduce({ kind: 'single', date: day(2026, 3, 3) }, day(2026, 3, 5), maxDays);
    expect(next).toEqual({ kind: 'interval', anchor: day(2026, 3, 3), latest: day(2026, 3, 5) });
  });

  test('single(A) + click at exactly max reach → interval', () => {
    // maxDays = 3 → reach of 2 days → |X-A| ≤ 2 forms interval
    const next = reduce({ kind: 'single', date: day(2026, 3, 3) }, day(2026, 3, 1), maxDays);
    expect(next).toEqual({ kind: 'interval', anchor: day(2026, 3, 3), latest: day(2026, 3, 1) });
  });

  test('single(A) + click beyond reach → single(X)', () => {
    const next = reduce({ kind: 'single', date: day(2026, 3, 3) }, day(2026, 3, 6), maxDays);
    expect(next).toEqual({ kind: 'single', date: day(2026, 3, 6) });
  });

  test('single(A) + click same day → no-op', () => {
    const state: RangeFsmState = { kind: 'single', date: day(2026, 3, 3) };
    const next = reduce(state, day(2026, 3, 3, 23), maxDays);
    expect(next).toEqual(state);
  });

  test('interval + click on anchor → single(clicked)', () => {
    const state: RangeFsmState = { kind: 'interval', anchor: day(2026, 3, 3), latest: day(2026, 3, 5) };
    const next = reduce(state, day(2026, 3, 3), maxDays);
    expect(next).toEqual({ kind: 'single', date: day(2026, 3, 3) });
  });

  test('interval + click on latest → single(clicked)', () => {
    const state: RangeFsmState = { kind: 'interval', anchor: day(2026, 3, 3), latest: day(2026, 3, 5) };
    const next = reduce(state, day(2026, 3, 5), maxDays);
    expect(next).toEqual({ kind: 'single', date: day(2026, 3, 5) });
  });

  test('interval + click in middle → interval(anchor: latest, latest: clicked)', () => {
    const state: RangeFsmState = { kind: 'interval', anchor: day(2026, 3, 3), latest: day(2026, 3, 5) };
    const next = reduce(state, day(2026, 3, 4), maxDays);
    expect(next).toEqual({ kind: 'interval', anchor: day(2026, 3, 5), latest: day(2026, 3, 4) });
  });

  test('interval built backward + middle click preserves the latest click', () => {
    // single(3), click 1 → interval(anchor: 3, latest: 1), display [1, 3]
    // click 2 → interval(anchor: 1, latest: 2), display [1, 2]
    const state: RangeFsmState = { kind: 'interval', anchor: day(2026, 3, 3), latest: day(2026, 3, 1) };
    const next = reduce(state, day(2026, 3, 2), maxDays);
    expect(next).toEqual({ kind: 'interval', anchor: day(2026, 3, 1), latest: day(2026, 3, 2) });
  });

  test('interval + click before interval → single(clicked)', () => {
    const state: RangeFsmState = { kind: 'interval', anchor: day(2026, 3, 3), latest: day(2026, 3, 5) };
    const next = reduce(state, day(2026, 3, 1), maxDays);
    expect(next).toEqual({ kind: 'single', date: day(2026, 3, 1) });
  });

  test('interval + click after interval → single(clicked)', () => {
    const state: RangeFsmState = { kind: 'interval', anchor: day(2026, 3, 3), latest: day(2026, 3, 5) };
    const next = reduce(state, day(2026, 3, 7), maxDays);
    expect(next).toEqual({ kind: 'single', date: day(2026, 3, 7) });
  });

  test('example from the proposal: click 1 → click 3 → click 4', () => {
    let state: RangeFsmState = { kind: 'empty' };
    state = reduce(state, day(2026, 3, 1), maxDays);
    expect(state).toEqual({ kind: 'single', date: day(2026, 3, 1) });
    state = reduce(state, day(2026, 3, 3), maxDays);
    expect(state).toEqual({ kind: 'interval', anchor: day(2026, 3, 1), latest: day(2026, 3, 3) });
    state = reduce(state, day(2026, 3, 4), maxDays);
    expect(state).toEqual({ kind: 'single', date: day(2026, 3, 4) });
  });
});

describe('toDisplayRange', () => {
  test('empty → null', () => {
    expect(toDisplayRange({ kind: 'empty' })).toBeNull();
  });

  test('single → { start, end: null }', () => {
    const d = day(2026, 3, 3);
    expect(toDisplayRange({ kind: 'single', date: d })).toEqual({ start: d, end: null });
  });

  test('interval normalizes to [min, max]', () => {
    const a = day(2026, 3, 5);
    const l = day(2026, 3, 3);
    expect(toDisplayRange({ kind: 'interval', anchor: a, latest: l })).toEqual({ start: l, end: a });
  });
});

describe('hydrate', () => {
  test('null range → empty', () => {
    expect(hydrate(null)).toEqual({ kind: 'empty' });
  });

  test('same-day range → single', () => {
    const d = day(2026, 3, 3);
    const range = {
      startDate: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0),
      endDate: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59),
    };
    const state = hydrate(range);
    expect(state.kind).toBe('single');
  });

  test('multi-day range → interval', () => {
    const state = hydrate({ startDate: day(2026, 3, 3), endDate: day(2026, 3, 5) });
    expect(state).toEqual({ kind: 'interval', anchor: day(2026, 3, 3), latest: day(2026, 3, 5) });
  });
});

describe('toCommit', () => {
  test('empty → null', () => {
    expect(toCommit({ kind: 'empty' })).toBeNull();
  });

  test('single → { start: D 00:00:00, end: D 23:59:59.999 }', () => {
    const committed = toCommit({ kind: 'single', date: day(2026, 3, 3, 15) });
    expect(committed).not.toBeNull();
    expect(committed!.startDate.getHours()).toBe(0);
    expect(committed!.startDate.getMinutes()).toBe(0);
    expect(committed!.endDate.getHours()).toBe(23);
    expect(committed!.endDate.getMilliseconds()).toBe(999);
    // same calendar day on both ends
    expect(committed!.startDate.getDate()).toBe(committed!.endDate.getDate());
  });

  test('interval commits normalized [min, max] with time boundaries', () => {
    const committed = toCommit({
      kind: 'interval',
      anchor: day(2026, 3, 5),
      latest: day(2026, 3, 3),
    });
    expect(committed).not.toBeNull();
    // start is the earlier date
    expect(committed!.startDate.getDate()).toBe(3);
    expect(committed!.endDate.getDate()).toBe(5);
    expect(committed!.startDate.getHours()).toBe(0);
    expect(committed!.endDate.getHours()).toBe(23);
  });
});

describe('hydrate/toCommit round-trip', () => {
  test('interval committed then rehydrated preserves dates', () => {
    const original: RangeFsmState = { kind: 'interval', anchor: day(2026, 3, 3), latest: day(2026, 3, 5) };
    const committed = toCommit(original);
    const rehydrated = hydrate(committed);
    expect(rehydrated.kind).toBe('interval');
    if (rehydrated.kind === 'interval') {
      expect(rehydrated.anchor.getDate()).toBe(3);
      expect(rehydrated.latest.getDate()).toBe(5);
    }
  });
});
