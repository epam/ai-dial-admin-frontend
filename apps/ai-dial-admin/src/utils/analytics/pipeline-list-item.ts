import { Pipeline, PipelineListItem } from '@/src/models/analytics/pipeline';

export const toPipelineListItem = (pipeline: Pipeline): PipelineListItem => ({
  name: pipeline.name,
  kind: pipeline.kind,
  target: pipeline.target,
  inputs: pipeline.inputs,
  trigger: pipeline.trigger,
  enabled: pipeline.enabled,
  generation: pipeline.generation,
  updated_at: pipeline.updated_at,
  evaluator_name: pipeline.evaluator_name,
  evaluator_version: pipeline.evaluator_version,
  evaluator: pipeline.evaluator && {
    name: pipeline.evaluator.name,
    version: pipeline.evaluator.version,
    type: pipeline.evaluator.type,
  },
  grain_key: pipeline.grain_key,
  version_column: pipeline.version_column,
});
