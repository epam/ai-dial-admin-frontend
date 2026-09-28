'use client';

import { FC } from 'react';

import AggregateDetailView from '@/src/components/Analytics/Pipelines/Aggregate/AggregateDetailView';
import EnrichDetailView from '@/src/components/Analytics/Pipelines/Enrich/EnrichDetailView';
import { Pipeline, PipelineKind } from '@/src/models/analytics/pipeline';
import { QueryFunction } from '@/src/models/analytics/query-function';

interface Props {
  pipeline: Pipeline;
  takenTargets: string[];
  functions?: QueryFunction[];
}

const PipelineDetailView: FC<Props> = ({ pipeline, takenTargets, functions }) =>
  pipeline.kind === PipelineKind.Aggregate ? (
    <AggregateDetailView pipeline={pipeline} takenTargets={takenTargets} functions={functions} />
  ) : (
    <EnrichDetailView pipeline={pipeline} takenTargets={takenTargets} />
  );

export default PipelineDetailView;
