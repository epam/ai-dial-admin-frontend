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
    target: draft.target,
    input: getPipelineInput(draft.inputs),
  });

  const onChange = useCallback((patch: PipelineDraft) => setDraft((prev) => ({ ...prev, ...patch })), []);

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
  const cron = trimmedString(trigger?.cron);
  // The service never parses the expression, so a typed one that does not is the console's to catch.
  const hasInvalidCron = Boolean(cron) && !isValidSixFieldCron(cron);

  // Only a group trigger carries a member selection, and the service bounds its limit.
  const isMemberSelectValid =
    trigger?.kind !== TriggerKind.Group || !trigger.member_select || isValidMemberLimit(trigger.member_select.limit);

  const isTargetResolved = Boolean(resolution.target) && !resolution.isTargetPending && !resolution.hasTargetError;

  // What a registration takes, and the whole of it: the service stores the rest as the author writes
  // it, and refuses what is missing only when the pipeline is armed.
  const isRegistrationValid = isValidPipelineName(draft.name) && Boolean(draft.target) && isTargetResolved;

  /** A value that was authored and cannot be stored as authored. Each kind's form adds its own. */
  const hasSharedFieldErrors = hasInvalidCron || !isCostCeilingValid || !isMemberSelectValid;

  const buildDto = useCallback(
    (): CreatePipelineDto =>
      buildPipelineDto(draft, {
        grainKey,
        sourceTable: resolution.target?.source_table,
        storedTransform: pipeline?.transform,
      }),
    [draft, grainKey, resolution.target?.source_table, pipeline?.transform],
  );

  return {
    draft,
    onChange,
    onTriggerChange,
    replaceDraft,
    reset,
    buildDto,
    availableTargets,
    isRegistrationValid,
    hasSharedFieldErrors,
    hasInvalidCron,
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
