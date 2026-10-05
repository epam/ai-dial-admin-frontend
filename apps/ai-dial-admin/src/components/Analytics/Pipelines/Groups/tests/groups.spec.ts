import { describe, expect, test } from 'vitest';

import {
  deriveGroupState,
  evaluationsToday,
  isAtCeiling,
  nextUtcMidnight,
  readinessSummary,
} from '@/src/components/Analytics/Pipelines/Groups/groups';
import { GroupCondition, GroupState } from '@/src/components/Analytics/Pipelines/Groups/models';
import { groupMock, HOUR, isoAgo, MINUTE, NOW } from '@/src/components/Analytics/Pipelines/Groups/tests/mock';

describe('deriveGroupState', () => {
  test('a clean group is up to date whatever else holds', () => {
    const group = groupMock({ dirty: false, signalled: true, last_activity_at: isoAgo(5 * HOUR) });

    expect(deriveGroupState(group, { idle: '10m', signal: 'x = 1' }, NOW).state).toBe(GroupState.UpToDate);
  });

  test('the ceiling outranks a met trigger', () => {
    const group = groupMock({ last_activity_at: isoAgo(20 * MINUTE), evaluations: 20 });

    expect(deriveGroupState(group, { idle: '10m', cost_ceiling: 20 }, NOW).state).toBe(GroupState.AtCap);
  });

  test('a group quiet past idle is ready, with nothing left', () => {
    const group = groupMock({ last_activity_at: isoAgo(14 * MINUTE) });
    const { state, checks } = deriveGroupState(group, { idle: '10m' }, NOW);

    expect(state).toBe(GroupState.Ready);
    expect(checks[0]).toMatchObject({ condition: GroupCondition.Idle, isSatisfied: true, remaining: 0 });
  });

  test('a waiting group states its quiet time, threshold and time left', () => {
    const { state, checks } = deriveGroupState(groupMock(), { idle: 'PT10M' }, NOW);

    expect(state).toBe(GroupState.Waiting);
    expect(checks[0]).toMatchObject({
      isSatisfied: false,
      value: 2 * MINUTE,
      threshold: 10 * MINUTE,
      remaining: 8 * MINUTE,
    });
  });

  test('a signalled group is ready before its idle window', () => {
    const group = groupMock({ signalled: true });

    expect(deriveGroupState(group, { idle: '10m', signal: 'x = 1' }, NOW).state).toBe(GroupState.Ready);
  });

  test('a signal is ignored where none is declared', () => {
    const group = groupMock({ signalled: true });

    expect(deriveGroupState(group, { idle: '10m' }, NOW).state).toBe(GroupState.Waiting);
  });

  test('staleness needs a previous evaluation', () => {
    const { state, checks } = deriveGroupState(groupMock(), { max_staleness: '1h' }, NOW);

    expect(state).toBe(GroupState.Waiting);
    expect(checks.find((check) => check.condition === GroupCondition.MaxStaleness)).toMatchObject({
      isSatisfied: false,
      value: undefined,
    });
  });

  test('a stale previous evaluation makes a dirty group ready', () => {
    const group = groupMock({ computed_at: isoAgo(25 * HOUR) });

    expect(deriveGroupState(group, { max_staleness: '24h' }, NOW).state).toBe(GroupState.Ready);
  });

  test('a dirty group on a default idle is waiting, with its quiet time and no threshold', () => {
    const group = groupMock({ last_activity_at: isoAgo(40 * MINUTE) });
    const { state, checks } = deriveGroupState(group, { signal: 'x = 1' }, NOW);

    expect(state).toBe(GroupState.Waiting);
    expect(checks[0]).toEqual(
      expect.objectContaining({ condition: GroupCondition.DefaultIdle, isSatisfied: false, value: 40 * MINUTE }),
    );
    expect(checks[0].threshold).toBeUndefined();
  });

  test('a compound ISO threshold is read in full', () => {
    const group = groupMock({ last_activity_at: isoAgo(2 * HOUR) });

    expect(deriveGroupState(group, { idle: 'PT1H30M' }, NOW).state).toBe(GroupState.Ready);
  });

  test('an unreadable duration is never met', () => {
    const group = groupMock({ last_activity_at: isoAgo(5 * HOUR) });

    expect(deriveGroupState(group, { idle: 'soon' }, NOW).checks[0]).toMatchObject({
      isSatisfied: false,
      threshold: undefined,
    });
  });

  test('yesterday’s count does not hold a group at the ceiling', () => {
    const group = groupMock({ last_activity_at: isoAgo(20 * MINUTE), evaluations: 20, evaluations_day: '2026-10-04' });

    expect(deriveGroupState(group, { idle: '10m', cost_ceiling: 20 }, NOW).state).toBe(GroupState.Ready);
  });
});

describe('evaluationsToday', () => {
  test('counts today and reads an earlier day as zero', () => {
    expect(evaluationsToday(groupMock({ evaluations: 7 }), NOW)).toBe(7);
    expect(evaluationsToday(groupMock({ evaluations: 7, evaluations_day: '2026-10-04' }), NOW)).toBe(0);
    expect(evaluationsToday(groupMock({ evaluations: 7, evaluations_day: null }), NOW)).toBe(0);
  });
});

describe('isAtCeiling', () => {
  test('holds any group, clean or dirty, that has spent today’s evaluations', () => {
    expect(isAtCeiling(groupMock({ dirty: false, evaluations: 20 }), { idle: '10m', cost_ceiling: 20 }, NOW)).toBe(
      true,
    );
    expect(isAtCeiling(groupMock({ evaluations: 19 }), { idle: '10m', cost_ceiling: 20 }, NOW)).toBe(false);
  });

  test('never holds a group without a declared ceiling or with yesterday’s count', () => {
    expect(isAtCeiling(groupMock({ evaluations: 99 }), { idle: '10m' }, NOW)).toBe(false);
    expect(
      isAtCeiling(
        groupMock({ evaluations: 20, evaluations_day: '2026-10-04' }),
        { idle: '10m', cost_ceiling: 20 },
        NOW,
      ),
    ).toBe(false);
  });
});

describe('nextUtcMidnight', () => {
  test('is the start of the next UTC day', () => {
    expect(nextUtcMidnight(NOW)).toBe(Date.parse('2026-10-06T00:00:00Z'));
  });
});

describe('readinessSummary', () => {
  test('lists every declared trigger in editor order, and the ceiling as a limit', () => {
    expect(readinessSummary({ signal: 'x = 1', max_staleness: '24h', idle: '10m', cost_ceiling: 20 })).toEqual({
      triggers: [
        { condition: GroupCondition.Idle, value: '10m' },
        { condition: GroupCondition.Signal, value: 'x = 1' },
        { condition: GroupCondition.MaxStaleness, value: '24h' },
      ],
      limits: [{ condition: GroupCondition.CostCeiling, value: '20' }],
    });
  });

  test('a signal-only pipeline shows the default idle and no limits', () => {
    expect(readinessSummary({ signal: 'x = 1' })).toEqual({
      triggers: [{ condition: GroupCondition.DefaultIdle }, { condition: GroupCondition.Signal, value: 'x = 1' }],
      limits: [],
    });
  });
});
