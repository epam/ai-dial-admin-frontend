'use client';

import { FC } from 'react';

import AggregateDetailView from '@/src/components/Analytics/Pipelines/Aggregate/AggregateDetailView';
import EnrichDetailView from '@/src/components/Analytics/Pipelines/Enrich/EnrichDetailView';
import { EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { Pipeline, PipelineKind } from '@/src/models/analytics/pipeline';
import { QueryFunction } from '@/src/models/analytics/query-function';

interface Props {
  pipeline: Pipeline;
  evaluators: EvaluatorSummary[];
  hasEvaluatorsError?: boolean;
  takenTargets: string[];
  functions?: QueryFunction[];
}

const PipelineDetailView: FC<Props> = ({ pipeline, evaluators, hasEvaluatorsError, takenTargets, functions }) =>
  pipeline.kind === PipelineKind.Aggregate ? (
    <AggregateDetailView pipeline={pipeline} takenTargets={takenTargets} functions={functions} />
  ) : (
    <EnrichDetailView
      pipeline={pipeline}
      evaluators={evaluators}
      hasEvaluatorsError={hasEvaluatorsError}
      takenTargets={takenTargets}
    />
  );

export default PipelineDetailView;
