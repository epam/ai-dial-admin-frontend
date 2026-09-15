'use client';

import { FC } from 'react';

import PipelineDetailFrame from '@/src/components/Analytics/Pipelines/Common/PipelineDetailFrame';
import PipelineStateSection from '@/src/components/Analytics/Pipelines/Common/PipelineStateSection';
import EnrichSection from '@/src/components/Analytics/Pipelines/Enrich/EnrichSection';
import { useEnrichForm } from '@/src/components/Analytics/Pipelines/Enrich/use-enrich-form';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useReadFailureNotification } from '@/src/hooks/use-read-failure-notification';
import { EvaluatorSummary } from '@/src/models/analytics/evaluator';
import { Pipeline } from '@/src/models/analytics/pipeline';
import { ReadFailure } from '@/src/models/server-action';

interface Props {
  pipeline: Pipeline;
  evaluators: EvaluatorSummary[];
  evaluatorsFailure?: ReadFailure | null;
  takenTargets: string[];
}

const EnrichDetailView: FC<Props> = ({ pipeline, evaluators, evaluatorsFailure, takenTargets }) => {
  const form = useEnrichForm({ pipeline, takenTargets });

  // Reported here rather than one level up: an aggregate pipeline declares no evaluator, so the same
  // failure is not its failure to report.
  useReadFailureNotification(evaluatorsFailure, AnalyticsPipelinesI18nKey.EvaluatorsLoadFailed);

  return (
    <PipelineDetailFrame pipeline={pipeline} form={form}>
      <EnrichSection
        form={form}
        evaluators={evaluators}
        hasEvaluatorsError={Boolean(evaluatorsFailure)}
        stateSection={<PipelineStateSection state={pipeline.state} />}
      />
    </PipelineDetailFrame>
  );
};

export default EnrichDetailView;
