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
});
