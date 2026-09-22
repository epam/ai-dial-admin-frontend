'use client';

import { useCallback, useEffect } from 'react';

import { usePipelineForm } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-form';
import { Pipeline, TransformType } from '@/src/models/analytics/pipeline';
import { PipelineDraft, TransformDraft } from '@/src/models/analytics/pipeline-ui';
import { isTransformValid } from '@/src/utils/analytics/transform-dto';

interface Params {
  pipeline?: Pipeline;
  takenTargets?: string[];
  initialDraft?: PipelineDraft;
}

export const useEnrichForm = (params: Params = {}) => {
  const base = usePipelineForm(params);
  const { draft, replaceDraft } = base;
  const transform = draft.transform;

  // The transform is a member of the one pipeline draft, so editing it is a patch of that draft rather
  // than a second draft with a dirty flag of its own.
  const onTransformChange = useCallback(
    (patch: Partial<TransformDraft>) =>
      replaceDraft((prev) => ({
        ...prev,
        transform: { ...(prev.transform ?? { type: TransformType.Llm }), ...patch },
      })),
    [replaceDraft],
  );

  // The service refuses a sql transform that declares inputs at all. The type is on the declaration, so
  // the drop happens as soon as it changes rather than after a resolution.
  useEffect(() => {
    if (transform?.type !== TransformType.Sql) return;

    replaceDraft((prev) => {
      if (!prev.transform?.inputs) return prev;
      const next = { ...prev, transform: { ...prev.transform } };
      delete next.transform.inputs;
      return next;
    });
  }, [transform?.type, replaceDraft]);

  // The one knob the console validates: the service refuses zero outright, naming `enabled: false` as how
  // a pipeline that evaluates nothing is declared, and refuses a value above 1 rather than reading it as a
  // percentage.
  const sampleFraction = draft.advanced?.sample_fraction;
  const isSampleFractionValid = sampleFraction == null || (sampleFraction > 0 && sampleFraction <= 1);

  const isValid = base.isSharedValid && isTransformValid(transform) && draft.enabled != null && isSampleFractionValid;

  return {
    ...base,
    transform,
    onTransformChange,
    isValid,
    isSampleFractionValid,
    // Different tables: the inputs are scoped to the read source, the outputs to the target.
    isVariablesReady: Boolean(base.readSource),
    isTransformReady: base.isTargetResolved,
  };
};

export type EnrichFormState = ReturnType<typeof useEnrichForm>;
