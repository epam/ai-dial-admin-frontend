'use client';
import { useCallback, useState } from 'react';
import { AggregateMode } from '@/src/components/Analytics/Pipelines/Aggregate/models';
import { usePipelineForm } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-form';
import { Pipeline } from '@/src/models/analytics/pipeline';
import { PipelineDraft } from '@/src/models/analytics/pipeline-ui';
interface Params {
  pipeline?: Pipeline;
  takenTargets?: string[];
  initialDraft?: PipelineDraft;
}
export const useAggregateForm = (params: Params = {}) => {
  const base = usePipelineForm(params);
  const { draft, onChange } = base;
  const [pendingMode, setPendingMode] = useState<AggregateMode | undefined>();

  // `sql` present, even blank, is what makes the draft a SQL declaration: the DTO is pruned by the same fact.
  const mode = draft.sql !== undefined ? AggregateMode.Sql : AggregateMode.Form;

  const hasFormContent = Boolean(draft.group_by?.length || draft.measures?.length);
  const hasSqlContent = Boolean(draft.sql?.trim());
  const hasModeContent = mode === AggregateMode.Sql ? hasSqlContent : hasFormContent;

  const applyMode = useCallback(
    (next: AggregateMode) => {
      // `undefined` rather than a missing key, so the patch overwrites what the draft held.
      if (next === AggregateMode.Sql)
        onChange({ sql: '', group_by: undefined, measures: undefined, filter: undefined });
      else onChange({ sql: undefined });
    },
    [onChange],
  );

  const onModeChange = useCallback(
    (next: AggregateMode) => {
      if (next === mode) return;
      if (hasModeContent) setPendingMode(next);
      else applyMode(next);
    },
    [mode, hasModeContent, applyMode],
  );

  const onConfirmModeChange = useCallback(() => {
    if (pendingMode) applyMode(pendingMode);
    setPendingMode(undefined);
  }, [pendingMode, applyMode]);

  const onCancelModeChange = useCallback(() => setPendingMode(undefined), []);

  // A measure the service cannot compile, unlike one the author has simply not written yet.
  const hasDistinctWithoutColumn = Boolean(draft.measures?.some((measure) => measure.distinct && !measure.column));
  return {
    ...base,
    mode,
    onModeChange,
    isModeChangePending: pendingMode !== undefined,
    onConfirmModeChange,
    onCancelModeChange,
    hasDistinctWithoutColumn,
    hasFieldErrors: base.hasSharedFieldErrors || hasDistinctWithoutColumn,
  };
};
export type AggregateFormState = ReturnType<typeof useAggregateForm>;
