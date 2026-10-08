import { Pipeline, PipelineKind, PipelineState, TransformType } from '@/src/models/analytics/pipeline';

/**
 * Which vocabulary the Runtime tab speaks for a pipeline. Fixed by the declaration rather than by the
 * runner's view: the view is absent exactly when the runner has restarted, which is when an operator is
 * looking, and a tab that changed its labels with the answer would read as two different pipelines.
 */
export enum PipelineRuntimeKind {
  Aggregate = 'aggregate',
  Sql = 'sql',
  Model = 'model',
}

export const getPipelineRuntimeKind = (pipeline: Pick<Pipeline, 'kind' | 'transform'>): PipelineRuntimeKind => {
  if (pipeline.kind === PipelineKind.Aggregate) return PipelineRuntimeKind.Aggregate;

  return pipeline.transform?.type === TransformType.Sql ? PipelineRuntimeKind.Sql : PipelineRuntimeKind.Model;
};

/**
 * An epoch-millisecond version the tab can state as a time, or nothing. A zero, a negative or a
 * non-finite value is not a moment, and stating the epoch for one would be a date nobody wrote.
 */
export const toEpochMillis = (version?: number): number | undefined =>
  version != null && Number.isFinite(version) && version > 0 ? version : undefined;

/**
 * The moment a pipeline's output is computed up to, from the registry's own position — never from the lag,
 * which is a difference against the moment of the read and says nothing about which data the output covers.
 * A pipeline that calls a model states how far behind it is instead, so it has none.
 */
export const getDataUpTo = (kind: PipelineRuntimeKind, state?: PipelineState): number | undefined => {
  switch (kind) {
    case PipelineRuntimeKind.Aggregate:
      return toEpochMillis(state?.cursor_version);
    case PipelineRuntimeKind.Sql:
      return toEpochMillis(state?.materialized_through_version);
    default:
      return undefined;
  }
};
