'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  getBindingRowError,
  hasBlockingBindingError,
} from '@/src/components/Analytics/EnrichmentRules/output-bindings';
import { useRuleResolution } from '@/src/components/Analytics/EnrichmentRules/use-rule-resolution';
import { EvaluatorType } from '@/src/models/analytics/evaluator';
import { RuleDraft } from '@/src/models/analytics/enrichment-rules-ui';
import { CreateRuleDto, EnrichmentRule, TriggerKind } from '@/src/models/analytics/rule';
import { GROUP_FETCH_MAX_ROWS } from '@/src/constants/analytics/enrichment-rules';
import { isValidSixFieldCron } from '@/src/utils/analytics/cron';
import { buildRuleDto, toRuleDraft } from '@/src/utils/analytics/rule-dto';

interface Params {
  rule?: EnrichmentRule;
  takenTargets?: string[];
}

export const useRuleForm = ({ rule, takenTargets = [] }: Params = {}) => {
  const [draft, setDraft] = useState<RuleDraft>(() => (rule ? toRuleDraft(rule) : {}));

  const resolution = useRuleResolution({
    evaluatorName: draft.evaluator_name,
    evaluatorVersion: draft.evaluator_version,
    targetEnrichment: draft.target_enrichment,
    source: draft.source,
  });

  const onChange = useCallback((patch: RuleDraft) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };

      // A version pinned against the previous evaluator does not exist on the new one.
      if (patch.evaluator_name !== undefined && patch.evaluator_name !== prev.evaluator_name) {
        delete next.evaluator_version;
      }

      return next;
    });
  }, []);

  const reset = useCallback((next: EnrichmentRule) => setDraft(toRuleDraft(next)), []);

  const availableTargets = useMemo(() => {
    // The edited rule's own target must stay listed, or the select is stranded on a value it does not offer.
    const taken = new Set(takenTargets.filter((name) => name !== rule?.target_enrichment));
    return resolution.enrichmentTables.filter((table) => !taken.has(table.name));
  }, [resolution.enrichmentTables, takenTargets, rule?.target_enrichment]);

  const { evaluator, grainKey, targetColumns, outputVars } = resolution;

  const boundOutputs = draft.output_bindings ?? [];
  const hasReadyWhen = Boolean(draft.ready_when?.idle || draft.ready_when?.max_staleness || draft.ready_when?.signal);
  const isCostCeilingValid = isPositiveIntegerOrEmpty(draft.ready_when?.cost_ceiling);
  const isCronValid = Boolean(draft.trigger_cron) && isValidSixFieldCron(draft.trigger_cron ?? '');
  const isSamplingValid = draft.sampling == null || (draft.sampling >= 0 && draft.sampling <= 1);
  // Only a group rule sends `member_select`, and only a group rule shows the control. Validating it for
  // any other kind blocks the save with a message that is not on screen.
  const isMemberSelectValid =
    draft.trigger_kind !== TriggerKind.Group || !draft.member_select || isValidMemberLimit(draft.member_select.limit);

  const isTriggerSatisfied = useMemo(() => {
    if (draft.trigger_kind === TriggerKind.Schedule) return isCronValid;
    if (draft.trigger_kind === TriggerKind.Group) return Boolean(grainKey) && hasReadyWhen && isCostCeilingValid;
    return draft.trigger_kind === TriggerKind.OnIngest;
  }, [draft.trigger_kind, isCronValid, grainKey, hasReadyWhen, isCostCeilingValid]);

  // A binding can outlive its definition — a dropped column, a variable gone in a newer evaluator version —
  // and saving it back would re-assert a mapping that no longer resolves.
  const hasStrandedBinding = boundOutputs.some((binding) =>
    hasBlockingBindingError(getBindingRowError({ id: binding.column, ...binding }, targetColumns, outputVars)),
  );

  const isSqlWithoutBindings = evaluator?.type === EvaluatorType.Sql && boundOutputs.length === 0;
  const isLlmWithoutBindings = evaluator?.type === EvaluatorType.Llm && boundOutputs.length === 0;

  // An unresolved evaluator or target leaves the bindings checked against nothing.
  const isResolved =
    Boolean(evaluator) &&
    Boolean(resolution.target) &&
    !resolution.isEvaluatorPending &&
    !resolution.isTargetPending &&
    !resolution.hasEvaluatorError &&
    !resolution.hasTargetError;

  const isValid =
    Boolean(draft.name?.trim()) &&
    Boolean(draft.evaluator_name) &&
    Boolean(draft.target_enrichment) &&
    draft.enabled != null &&
    isResolved &&
    isTriggerSatisfied &&
    !isSqlWithoutBindings &&
    !hasStrandedBinding &&
    isSamplingValid &&
    isMemberSelectValid;

  const buildDto = useCallback(
    (): CreateRuleDto => buildRuleDto(draft, { grainKey, sourceTable: resolution.target?.source_table }),
    [draft, grainKey, resolution.target?.source_table],
  );

  return {
    draft,
    onChange,
    reset,
    buildDto,
    availableTargets,
    isValid,
    isCronValid,
    isCostCeilingValid,
    isSamplingValid,
    isMemberSelectValid,
    hasReadyWhen,
    isSqlWithoutBindings,
    isLlmWithoutBindings,
    hasStrandedBinding,
    isBindingsReady: Boolean(evaluator && resolution.target),
    ...resolution,
  };
};

const isPositiveInteger = (value?: number): boolean => value != null && Number.isInteger(value) && value > 0;

const isValidMemberLimit = (value?: number): boolean =>
  isPositiveInteger(value) && Number(value) <= GROUP_FETCH_MAX_ROWS;

const isPositiveIntegerOrEmpty = (value?: number): boolean => value == null || isPositiveInteger(value);

export type RuleFormState = ReturnType<typeof useRuleForm>;
