import { EvaluatorListRow, EvaluatorSummary, EvaluatorUsage } from '@/src/models/analytics/evaluator';
import { PipelineListItem } from '@/src/models/analytics/pipeline';

export const toEvaluatorUsage = (pipelines: PipelineListItem[]): EvaluatorUsage =>
  pipelines.reduce<EvaluatorUsage>((usage, pipeline) => {
    const name = pipeline.evaluator_name;
    return name ? usage.set(name, (usage.get(name) ?? 0) + 1) : usage;
  }, new Map());

// Null rather than zero when usage is unknown: zero would claim the evaluator is unused.
export const toEvaluatorRows = (evaluators: EvaluatorSummary[], usage: EvaluatorUsage | null): EvaluatorListRow[] =>
  evaluators.map((evaluator) => ({
    name: evaluator.name,
    latest_version: evaluator.latest_version,
    created_at: evaluator.created_at,
    usedBy: usage ? (usage.get(evaluator.name) ?? 0) : null,
  }));

export const getReferencingPipelines = (pipelines: PipelineListItem[], evaluatorName: string): PipelineListItem[] =>
  pipelines.filter((pipeline) => pipeline.evaluator_name === evaluatorName);
