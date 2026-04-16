import { AnalyticsResult } from '@/src/models/evaluation/run';

import { buildComparisonSections, countDiffs, valuesAreEqual } from '../utils';

const makeResult = (overrides: Partial<AnalyticsResult> = {}): AnalyticsResult => ({
  id: 'r1',
  responseStatusCode: 200,
  runIndex: 0,
  executionStatus: 'SUCCESS' as const,
  execDurationMs: 1000,
  testCaseData: { input: 'hello' },
  extractedColumns: { answer: 'world' },
  requestBody: { prompt: 'test' },
  responseBody: { result: 'ok' },
  metricValues: {
    'eval.accuracy': { f1: 0.5, precision: 0.8 },
  },
  metricInfos: {
    'eval.accuracy': { f1: 'some info' },
  },
  ...overrides,
});

const defaultVisibility: Record<string, boolean> = {};
const defaultOrder: string[] = [];
const defaultHidden: Record<string, boolean> = {};

describe('buildComparisonSections', () => {
  it('builds sections for a single result', () => {
    const result = makeResult();
    const sections = buildComparisonSections(result, null, defaultVisibility, defaultOrder, defaultHidden);

    expect(sections.length).toBeGreaterThanOrEqual(4);

    const execution = sections.find((s) => s.key === 'execution');
    expect(execution).toBeDefined();
    expect(execution!.rows).toHaveLength(2);
    expect(execution!.rows[0].values).toHaveLength(1);

    const testCaseData = sections.find((s) => s.key === 'testCaseData');
    expect(testCaseData).toBeDefined();
    expect(testCaseData!.rows[0].label).toBe('input');

    const extractedColumns = sections.find((s) => s.key === 'extractedColumns');
    expect(extractedColumns).toBeDefined();

    const metricSection = sections.find((s) => s.key === 'metric:eval.accuracy');
    expect(metricSection).toBeDefined();
    expect(metricSection!.rows.length).toBe(2);
  });

  it('builds two-column sections with values ordered [pinned, active]', () => {
    const active = makeResult({ id: 'r1', testCaseData: { input: 'a' } });
    const pinned = makeResult({ id: 'r2', testCaseData: { input: 'b' } });
    const sections = buildComparisonSections(active, pinned, defaultVisibility, defaultOrder, defaultHidden);

    const tc = sections.find((s) => s.key === 'testCaseData');
    expect(tc!.rows[0].values).toHaveLength(2);
    expect(tc!.rows[0].values[0].raw).toBe('b'); // pinned
    expect(tc!.rows[0].values[1].raw).toBe('a'); // active
  });

  it('deduplicates when active === pinned (same id)', () => {
    const result = makeResult({ id: 'same' });
    const sections = buildComparisonSections(result, result, defaultVisibility, defaultOrder, defaultHidden);

    const execution = sections.find((s) => s.key === 'execution');
    expect(execution!.rows[0].values).toHaveLength(1);
  });

  it('handles null/missing values with union of keys', () => {
    const active = makeResult({ id: 'a', extractedColumns: { answer: 'x', extra: 'y' } });
    const pinned = makeResult({ id: 'b', extractedColumns: { answer: 'z' } });
    const sections = buildComparisonSections(active, pinned, defaultVisibility, defaultOrder, defaultHidden);

    const ec = sections.find((s) => s.key === 'extractedColumns');
    expect(ec!.rows).toHaveLength(2);

    const extraRow = ec!.rows.find((r) => r.fieldKey === 'extra');
    expect(extraRow!.values[0].raw).toBeNull(); // pinned doesn't have 'extra'
    expect(extraRow!.values[1].raw).toBe('y'); // active has 'extra'
  });

  it('unions metric groups across results', () => {
    const active = makeResult({ id: 'a', metricValues: { groupA: { f1: 0.5 } } });
    const pinned = makeResult({ id: 'b', metricValues: { groupB: { precision: 0.9 } } });
    const sections = buildComparisonSections(active, pinned, defaultVisibility, defaultOrder, defaultHidden);

    expect(sections.find((s) => s.key === 'metric:groupA')).toBeDefined();
    expect(sections.find((s) => s.key === 'metric:groupB')).toBeDefined();

    const groupA = sections.find((s) => s.key === 'metric:groupA')!;
    expect(groupA.rows[0].values[0].raw).toBeNull(); // pinned doesn't have groupA
    expect(groupA.rows[0].values[1].raw).toBe('0.5'); // active has groupA.f1
  });

  it('filters fields by visibility', () => {
    const result = makeResult();
    const visibility = { 'execution:executionStatus': false };
    const sections = buildComparisonSections(result, null, visibility, defaultOrder, defaultHidden);

    const execution = sections.find((s) => s.key === 'execution');
    expect(execution!.rows).toHaveLength(1);
    expect(execution!.rows[0].fieldKey).toBe('execDurationMs');
  });

  it('hides sections based on sectionHidden', () => {
    const result = makeResult();
    const hidden = { execution: true };
    const sections = buildComparisonSections(result, null, defaultVisibility, defaultOrder, hidden);

    expect(sections.find((s) => s.key === 'execution')).toBeUndefined();
  });

  it('reorders sections based on sectionOrder', () => {
    const result = makeResult();
    const order = ['extractedColumns', 'execution'];
    const sections = buildComparisonSections(result, null, defaultVisibility, order, defaultHidden);

    expect(sections[0].key).toBe('extractedColumns');
    expect(sections[1].key).toBe('execution');
  });

  it('serializes object values to JSON', () => {
    const result = makeResult({ id: 'r1', testCaseData: { nested: { a: 1, b: 2 } } });
    const sections = buildComparisonSections(result, null, defaultVisibility, defaultOrder, defaultHidden);

    const tc = sections.find((s) => s.key === 'testCaseData');
    const nestedRow = tc!.rows.find((r) => r.fieldKey === 'nested');
    expect(nestedRow!.values[0].raw).toBe(JSON.stringify({ a: 1, b: 2 }, null, 2));
  });

  it('serializes boolean values to string', () => {
    const result = makeResult({ id: 'r1', testCaseData: { flag: true as unknown } });
    const sections = buildComparisonSections(result, null, defaultVisibility, defaultOrder, defaultHidden);

    const tc = sections.find((s) => s.key === 'testCaseData');
    const flagRow = tc!.rows.find((r) => r.fieldKey === 'flag');
    expect(flagRow!.values[0].raw).toBe('true');
  });
});

describe('valuesAreEqual', () => {
  it('returns true for identical strings', () => {
    expect(valuesAreEqual('hello', 'hello')).toBe(true);
  });

  it('returns true for two nulls', () => {
    expect(valuesAreEqual(null, null)).toBe(true);
  });

  it('returns false for null vs non-null', () => {
    expect(valuesAreEqual(null, 'hello')).toBe(false);
    expect(valuesAreEqual('hello', null)).toBe(false);
  });

  it('normalizes numeric values', () => {
    expect(valuesAreEqual('0.500', '0.5')).toBe(true);
    expect(valuesAreEqual('1', '1.0')).toBe(true);
    expect(valuesAreEqual('0.1', '0.2')).toBe(false);
  });

  it('normalizes JSON values with different key order', () => {
    expect(valuesAreEqual('{"a":1,"b":2}', '{"b":2,"a":1}')).toBe(true);
  });

  it('returns false for different JSON values', () => {
    expect(valuesAreEqual('{"a":1}', '{"a":2}')).toBe(false);
  });

  it('returns false for different strings', () => {
    expect(valuesAreEqual('hello', 'world')).toBe(false);
  });
});

describe('countDiffs', () => {
  it('counts differing visible fields', () => {
    const active = makeResult({ id: 'a', testCaseData: { input: 'x' } });
    const pinned = makeResult({ id: 'b', testCaseData: { input: 'y' } });
    const sections = buildComparisonSections(active, pinned, defaultVisibility, defaultOrder, defaultHidden);

    const diffs = countDiffs(sections);
    expect(diffs).toBeGreaterThan(0);
  });

  it('returns 0 when no pinned (single column)', () => {
    const result = makeResult();
    const sections = buildComparisonSections(result, null, defaultVisibility, defaultOrder, defaultHidden);
    expect(countDiffs(sections)).toBe(0);
  });

  it('returns 0 when all values are equal', () => {
    const result = makeResult({ id: 'a' });
    const same = makeResult({ id: 'b' });
    const sections = buildComparisonSections(result, same, defaultVisibility, defaultOrder, defaultHidden);
    expect(countDiffs(sections)).toBe(0);
  });
});
