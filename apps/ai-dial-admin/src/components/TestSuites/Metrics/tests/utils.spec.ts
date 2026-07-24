import { describe, expect, test } from 'vitest';

import { Metric } from '@/src/models/evaluation/metric';
import { mergeMetricsWithDeclarations, mergeMetricsWithOutputSchemas } from '../utils';

describe('mergeMetricsWithDeclarations', () => {
  const declarations: Metric[] = [
    { id: 'decl-1', description: 'Declaration description' },
    { id: 'decl-2', description: 'Other declaration description' },
  ];

  test('fills in description from the matching declaration when metric has none', () => {
    const metrics: Metric[] = [{ id: 'metric-1', metricDeclarationId: 'decl-1' }];

    expect(mergeMetricsWithDeclarations(metrics, declarations)).toEqual([
      { id: 'metric-1', metricDeclarationId: 'decl-1', description: 'Declaration description' },
    ]);
  });

  test('keeps the metric own description when it already has one', () => {
    const metrics: Metric[] = [{ id: 'metric-1', metricDeclarationId: 'decl-1', description: 'Own description' }];

    expect(mergeMetricsWithDeclarations(metrics, declarations)).toEqual([
      { id: 'metric-1', metricDeclarationId: 'decl-1', description: 'Own description' },
    ]);
  });

  test('leaves description undefined when no declaration matches', () => {
    const metrics: Metric[] = [{ id: 'metric-1', metricDeclarationId: 'unknown-decl' }];

    expect(mergeMetricsWithDeclarations(metrics, declarations)).toEqual([
      { id: 'metric-1', metricDeclarationId: 'unknown-decl', description: undefined },
    ]);
  });

  test('returns an empty array for an empty metrics list', () => {
    expect(mergeMetricsWithDeclarations([], declarations)).toEqual([]);
  });

  test('handles an empty declarations list without throwing', () => {
    const metrics: Metric[] = [{ id: 'metric-1', metricDeclarationId: 'decl-1' }];

    expect(mergeMetricsWithDeclarations(metrics, [])).toEqual([
      { id: 'metric-1', metricDeclarationId: 'decl-1', description: undefined },
    ]);
  });
});

describe('mergeMetricsWithOutputSchemas', () => {
  test('merges fetched output schema when the metric has no output properties', () => {
    const metrics: Metric[] = [{ id: 'metric-1', outputSchema: {} }];
    const outputSchemasById = new Map([['metric-1', { type: 'object' as const, properties: { score: {} } }]]);

    expect(mergeMetricsWithOutputSchemas(metrics, outputSchemasById)).toEqual([
      { id: 'metric-1', outputSchema: { type: 'object', properties: { score: {} } } },
    ]);
  });

  test('keeps the metric own output schema when it already has properties', () => {
    const ownSchema = { type: 'object' as const, properties: { latency: {} } };
    const metrics: Metric[] = [{ id: 'metric-1', outputSchema: ownSchema }];
    const outputSchemasById = new Map([['metric-1', { type: 'object' as const, properties: { score: {} } }]]);

    expect(mergeMetricsWithOutputSchemas(metrics, outputSchemasById)).toEqual([
      { id: 'metric-1', outputSchema: ownSchema },
    ]);
  });

  test('leaves outputSchema unchanged when no fetched schema matches the metric id', () => {
    const metrics: Metric[] = [{ id: 'metric-1', outputSchema: {} }];

    expect(mergeMetricsWithOutputSchemas(metrics, new Map())).toEqual([{ id: 'metric-1', outputSchema: {} }]);
  });

  test('falls back to an empty key for a metric without an id', () => {
    const metrics: Metric[] = [{ outputSchema: {} }];

    expect(mergeMetricsWithOutputSchemas(metrics, new Map())).toEqual([{ outputSchema: {} }]);
  });

  test('returns an empty array for an empty metrics list', () => {
    expect(mergeMetricsWithOutputSchemas([], new Map())).toEqual([]);
  });
});
