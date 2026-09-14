'use client';

import { useEffect } from 'react';

import { usePipelineForm } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-form';
import { EvaluatorType } from '@/src/models/analytics/evaluator';
import { Pipeline } from '@/src/models/analytics/pipeline';
import { PipelineDraft } from '@/src/models/analytics/pipeline-ui';

interface Params {
  pipeline?: Pipeline;
  takenTargets?: string[];
  initialDraft?: PipelineDraft;
}

export const useEnrichForm = (params: Params = {}) => {
  const base = usePipelineForm(params);
  const { draft, evaluator, target, replaceDraft } = base;

  // A sql evaluator renders no request, so the service refuses a pipeline that declares vars at all. Which
  // type was picked is known only once the evaluator resolves, so the declaration goes then rather than
  // when the name is chosen — otherwise what the hidden editor left behind would reach the service as a 422.
  useEffect(() => {
    if (evaluator?.type !== EvaluatorType.Sql) return;

    replaceDraft((prev) => {
      if (!prev.vars) return prev;
      const next = { ...prev };
      delete next.vars;
      return next;
    });
  }, [evaluator?.type, replaceDraft]);

  // The one knob the console validates: the service refuses zero outright, naming `enabled: false` as how
  // a pipeline that evaluates nothing is declared, and refuses a value above 1 rather than reading it as a
  // percentage.
  const sampleFraction = draft.advanced?.sample_fraction;
  const isSampleFractionValid = sampleFraction == null || (sampleFraction > 0 && sampleFraction <= 1);

  const isEvaluatorResolved =
    Boolean(evaluator) && !base.isEvaluatorPending && !base.hasEvaluatorError && Boolean(target);

  const isValid =
    base.isSharedValid &&
    Boolean(draft.evaluator_name) &&
    draft.enabled != null &&
    isEvaluatorResolved &&
    isSampleFractionValid;

  return {
    ...base,
    isValid,
    isSampleFractionValid,
    isVariablesReady: Boolean(evaluator && base.readSource),
  };
};

export type EnrichFormState = ReturnType<typeof useEnrichForm>;
