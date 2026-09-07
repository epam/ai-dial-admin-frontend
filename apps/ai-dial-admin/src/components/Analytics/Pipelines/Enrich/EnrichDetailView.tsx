'use client';

import { FC } from 'react';

import PipelineDetailFrame from '@/src/components/Analytics/Pipelines/Common/PipelineDetailFrame';
import EnrichSection from '@/src/components/Analytics/Pipelines/Enrich/EnrichSection';
import { useEnrichForm } from '@/src/components/Analytics/Pipelines/Enrich/use-enrich-form';
import { EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { Pipeline } from '@/src/models/analytics/pipeline';

interface Props {
  pipeline: Pipeline;
  evaluators: EvaluatorSummary[];
  hasEvaluatorsError?: boolean;
  takenTargets: string[];
}

const EnrichDetailView: FC<Props> = ({ pipeline, evaluators, hasEvaluatorsError, takenTargets }) => {
  const form = useEnrichForm({ pipeline, takenTargets });

  return (
    <PipelineDetailFrame pipeline={pipeline} form={form}>
      <EnrichSection form={form} evaluators={evaluators} hasEvaluatorsError={hasEvaluatorsError} />
    </PipelineDetailFrame>
  );
};

export default EnrichDetailView;
