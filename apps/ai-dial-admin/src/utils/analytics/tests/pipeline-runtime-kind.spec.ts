import { PipelineKind, TransformType } from '@/src/models/analytics/pipeline';
import {
  getDataUpTo,
  getPipelineRuntimeKind,
  PipelineRuntimeKind,
  toEpochMillis,
} from '@/src/utils/analytics/pipeline-runtime-kind';

describe('getPipelineRuntimeKind', () => {
  test('reads an aggregate from its kind', () => {
    expect(getPipelineRuntimeKind({ kind: PipelineKind.Aggregate })).toBe(PipelineRuntimeKind.Aggregate);
  });

  test('reads a SQL enrichment from its transform', () => {
    expect(getPipelineRuntimeKind({ kind: PipelineKind.Enrich, transform: { type: TransformType.Sql } })).toBe(
      PipelineRuntimeKind.Sql,
    );
  });

  test('reads any other enrichment as one that calls a model', () => {
    expect(getPipelineRuntimeKind({ kind: PipelineKind.Enrich, transform: { type: TransformType.Llm } })).toBe(
      PipelineRuntimeKind.Model,
    );
    expect(getPipelineRuntimeKind({ kind: PipelineKind.Enrich })).toBe(PipelineRuntimeKind.Model);
  });
});

describe('toEpochMillis', () => {
  test('keeps a positive finite version', () => {
    expect(toEpochMillis(1_700_000_000_000)).toBe(1_700_000_000_000);
  });

  test.each([undefined, 0, -1, Number.NaN, Number.POSITIVE_INFINITY])('drops %s', (value) => {
    expect(toEpochMillis(value)).toBeUndefined();
  });
});

describe('getDataUpTo', () => {
  const state = { cursor_version: 1_700_000_000_000, materialized_through_version: 1_800_000_000_000, lag_seconds: 5 };

  test('reads an aggregate from its cursor version', () => {
    expect(getDataUpTo(PipelineRuntimeKind.Aggregate, state)).toBe(1_700_000_000_000);
  });

  test('reads a SQL enrichment from its materialized-through version', () => {
    expect(getDataUpTo(PipelineRuntimeKind.Sql, state)).toBe(1_800_000_000_000);
  });

  test('states nothing for a pipeline that calls a model, nor for a missing state', () => {
    expect(getDataUpTo(PipelineRuntimeKind.Model, state)).toBeUndefined();
    expect(getDataUpTo(PipelineRuntimeKind.Sql, undefined)).toBeUndefined();
  });
});
