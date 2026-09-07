'use client';

import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react';

import { usePipelineResolution } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-resolution';
import { PipelineDraft } from '@/src/models/analytics/pipeline-ui';
import {
  CreatePipelineDto,
  Pipeline,
  PipelineKind,
  PipelineTrigger,
  TriggerKind,
} from '@/src/models/analytics/pipeline';
import { AnalyticsTableType } from '@/src/models/analytics/table';
import { GROUP_FETCH_MAX_ROWS } from '@/src/constants/analytics/pipelines';
import { isValidSixFieldCron } from '@/src/utils/analytics/cron';
import { buildPipelineDto, getPipelineInput, toPipelineDraft } from '@/src/utils/analytics/pipeline-dto';
import { trimmedString } from '@/src/utils/formatting/trimmed-string';

interface Params {
  pipeline?: Pipeline;
  takenTargets?: string[];
  initialDraft?: PipelineDraft;
}

const PIPELINE_NAME_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;

export const isValidPipelineName = (name?: string): boolean => PIPELINE_NAME_PATTERN.test(trimmedString(name) ?? '');

export const usePipelineForm = ({ pipeline, takenTargets = [], initialDraft }: Params = {}) => {
  const [draft, setDraft] = useState<PipelineDraft>(() =>
    pipeline ? toPipelineDraft(pipeline) : (initialDraft ?? {}),
  );

  const resolution = usePipelineResolution({
    evaluatorName: draft.evaluator_name,
    evaluatorVersion: draft.evaluator_version,
    target: draft.target,
    input: getPipelineInput(draft.inputs),
  });

  const onChange = useCallback((patch: PipelineDraft) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };

      // A version pinned against the previous evaluator does not exist on the new one.
      if (patch.evaluator_name !== undefined && patch.evaluator_name !== prev.evaluator_name) {
        delete next.evaluator_version;
      }

      return next;
    });
  }, []);

  const onTriggerChange = useCallback(
    (patch: Partial<PipelineTrigger>) =>
      setDraft((prev) => ({ ...prev, trigger: { ...(prev.trigger ?? { kind: TriggerKind.OnIngest }), ...patch } })),
    [],
  );

  const reset = useCallback((next: Pipeline) => setDraft(toPipelineDraft(next)), []);

  const replaceDraft: Dispatch<SetStateAction<PipelineDraft>> = setDraft;

  const availableTargets = useMemo(() => {
    const taken = new Set(takenTargets.filter((name) => name !== pipeline?.target));

    const candidateType =
      draft.kind === PipelineKind.Aggregate ? AnalyticsTableType.Source : AnalyticsTableType.Enrichment;

    return resolution.tables.filter(
      (table) => table.type === candidateType && table.permissions?.write !== false && !taken.has(table.name),
    );
  }, [resolution.tables, takenTargets, pipeline?.target, draft.kind]);

  const { grainKey } = resolution;
  const trigger = draft.trigger;

  const hasReadyWhen = Boolean(
    trigger?.ready_when?.idle || trigger?.ready_when?.max_staleness || trigger?.ready_when?.signal,
  );
  const isCostCeilingValid = isPositiveIntegerOrEmpty(trigger?.ready_when?.cost_ceiling);
  const isCronValid = Boolean(trimmedString(trigger?.cron)) && isValidSixFieldCron(trimmedString(trigger?.cron));

  // any other kind blocks the save with a message that is not on screen.
  const isMemberSelectValid =
    trigger?.kind !== TriggerKind.Group || !trigger.member_select || isValidMemberLimit(trigger.member_select.limit);

  const isTriggerSatisfied = useMemo(() => {
    if (draft.kind === PipelineKind.Aggregate) return isCronValid;
    if (trigger?.kind === TriggerKind.Schedule) return isCronValid;
    if (trigger?.kind === TriggerKind.Group) return Boolean(grainKey) && hasReadyWhen && isCostCeilingValid;
    return trigger?.kind === TriggerKind.OnIngest;
  }, [draft.kind, trigger?.kind, isCronValid, grainKey, hasReadyWhen, isCostCeilingValid]);

  const isTargetResolved = Boolean(resolution.target) && !resolution.isTargetPending && !resolution.hasTargetError;

  const isSharedValid =
    isValidPipelineName(draft.name) &&
    Boolean(draft.kind) &&
    Boolean(draft.target) &&
    isTargetResolved &&
    isTriggerSatisfied &&
    isMemberSelectValid;

  const buildDto = useCallback(
    (): CreatePipelineDto => buildPipelineDto(draft, { grainKey, sourceTable: resolution.target?.source_table }),
    [draft, grainKey, resolution.target?.source_table],
  );

  return {
    draft,
    onChange,
    onTriggerChange,
    replaceDraft,
    reset,
    buildDto,
    availableTargets,
    isSharedValid,
    isCronValid,
    isCostCeilingValid,
    isMemberSelectValid,
    isTargetResolved,
    hasReadyWhen,
    ...resolution,
  };
};

const isPositiveInteger = (value?: number): boolean => value != null && Number.isInteger(value) && value > 0;

const isValidMemberLimit = (value?: number): boolean =>
  isPositiveInteger(value) && Number(value) <= GROUP_FETCH_MAX_ROWS;

const isPositiveIntegerOrEmpty = (value?: number): boolean => value == null || isPositiveInteger(value);

export type PipelineFormState = ReturnType<typeof usePipelineForm>;
