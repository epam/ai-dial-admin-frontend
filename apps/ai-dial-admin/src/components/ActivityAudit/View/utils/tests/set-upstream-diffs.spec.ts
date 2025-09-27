import { describe, it, expect } from 'vitest';
import { setUpstreamDiffs } from '../set-upstream-diffs';
import { EntityParameterKeys } from '@/src/components/ActivityAudit/constants';

// Mock ActivityAuditDiff and ActivityAuditSection
const makeDiff = (id: string) => ({ id }) as any;

describe('setUpstreamDiffs', () => {
  it('adds upstream diffs when present in current', () => {
    const sections: any = {};
    const current = { 'upstreams-1': [makeDiff('a')] };
    const compare = { 'upstreams-1': [makeDiff('b')] };
    setUpstreamDiffs(sections, current, compare);
    expect(sections[EntityParameterKeys.UPSTREAMS]).toEqual([{ current: [makeDiff('a')], compare: [makeDiff('b')] }]);
  });

  it('adds upstream diffs when present in compare only', () => {
    const sections: any = {};
    const current = {};
    const compare = { 'upstreams-2': [makeDiff('c')] };
    setUpstreamDiffs(sections, current, compare);
    expect(sections[EntityParameterKeys.UPSTREAMS]).toEqual([{ current: undefined, compare: [makeDiff('c')] }]);
  });

  it('does not add if both current and compare are empty for upstreams', () => {
    const sections: any = {};
    const current = { 'upstreams-3': [] };
    const compare = { 'upstreams-3': [] };
    setUpstreamDiffs(sections, current, compare);
    expect(sections[EntityParameterKeys.UPSTREAMS]).toBeUndefined();
  });

  it('handles multiple upstream keys', () => {
    const sections: any = {};
    const current = { 'upstreams-1': [makeDiff('a')], 'upstreams-2': [] };
    const compare = { 'upstreams-1': [], 'upstreams-2': [makeDiff('b')] };
    setUpstreamDiffs(sections, current, compare);
    expect(sections[EntityParameterKeys.UPSTREAMS]).toEqual([
      { current: [makeDiff('a')], compare: [] },
      { current: [], compare: [makeDiff('b')] },
    ]);
  });

  it('appends to existing sections[UPSTREAMS]', () => {
    const sections: any = { [EntityParameterKeys.UPSTREAMS]: [{ current: [], compare: [] }] };
    const current = { 'upstreams-4': [makeDiff('x')] };
    const compare = { 'upstreams-4': [makeDiff('y')] };
    setUpstreamDiffs(sections, current, compare);
    expect(sections[EntityParameterKeys.UPSTREAMS].length).toBe(2);
    expect(sections[EntityParameterKeys.UPSTREAMS][1]).toEqual({ current: [makeDiff('x')], compare: [makeDiff('y')] });
  });
});
