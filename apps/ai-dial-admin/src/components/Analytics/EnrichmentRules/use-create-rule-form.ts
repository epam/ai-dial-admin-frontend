'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getEvaluator, getEvaluatorVersion, getTable, getTables } from '@/src/app/[lang]/enrichment-rules/actions';
import {
  createBindingRow,
  getBindingRowError,
  hasBlockingBindingError,
  toOutputBindings,
} from '@/src/components/Analytics/EnrichmentRules/output-bindings';
import { LATEST_VERSION } from '@/src/constants/analytics/enrichment-rules';
import { Evaluator, EvaluatorType } from '@/src/models/analytics/evaluator';
import { CreateRuleForm, OutputBindingRow } from '@/src/models/analytics/enrichment-rules-ui';
import { CreateRuleDto, ReadyWhen, TriggerKind } from '@/src/models/analytics/rule';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';
import { isValidSixFieldCron } from '@/src/utils/analytics/cron';

const createEmptyForm = (): CreateRuleForm => ({
  name: '',
  evaluatorName: '',
  evaluatorVersion: LATEST_VERSION,
  targetEnrichment: '',
  triggerKind: '',
  enabled: null,
  triggerCron: '',
  idle: '',
  maxStaleness: '',
  costCeiling: '',
  bindings: [createBindingRow()],
});

export const useCreateRuleForm = (takenTargets: string[]) => {
  const [form, setForm] = useState<CreateRuleForm>(createEmptyForm);
  const [tables, setTables] = useState<AnalyticsTable[]>([]);
  const [isTablesLoading, setIsTablesLoading] = useState(true);
  const [evaluator, setEvaluator] = useState<Evaluator | null>(null);
  const [target, setTarget] = useState<AnalyticsTable | null>(null);
  const [isEvaluatorPending, setIsEvaluatorPending] = useState(false);
  const [isTargetPending, setIsTargetPending] = useState(false);
  const [hasEvaluatorError, setHasEvaluatorError] = useState(false);
  const [hasTargetError, setHasTargetError] = useState(false);

  const evaluatorCache = useRef(new Map<string, Evaluator>());
  const tableCache = useRef(new Map<string, AnalyticsTable>());

  const setField = useCallback(<K extends keyof CreateRuleForm>(key: K, value: CreateRuleForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // A version pinned against the previous evaluator does not exist on the new one, and the resolve
      // would 404 while the select still displayed the stale number.
      if (key === 'evaluatorName' && value !== prev.evaluatorName) {
        next.evaluatorVersion = LATEST_VERSION;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        const list = await getTables();
        if (!isCancelled && Array.isArray(list)) setTables(list);
      } finally {
        if (!isCancelled) setIsTablesLoading(false);
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, []);

  const { evaluatorName, evaluatorVersion, targetEnrichment } = form;

  useEffect(() => {
    if (!evaluatorName) {
      setEvaluator(null);
      setIsEvaluatorPending(false);
      setHasEvaluatorError(false);
      return;
    }

    const key = `${evaluatorName}@${evaluatorVersion}`;
    const cached = evaluatorCache.current.get(key);
    if (cached) {
      setEvaluator(cached);
      setIsEvaluatorPending(false);
      setHasEvaluatorError(false);
      return;
    }

    let isCancelled = false;
    setIsEvaluatorPending(true);
    setHasEvaluatorError(false);

    const resolve = async () => {
      try {
        const res =
          evaluatorVersion === LATEST_VERSION
            ? await getEvaluator(evaluatorName)
            : await getEvaluatorVersion(evaluatorName, Number(evaluatorVersion));

        if (isCancelled) return;

        if (res) {
          evaluatorCache.current.set(key, res);
          setEvaluator(res);
        } else {
          setEvaluator(null);
          setHasEvaluatorError(true);
        }
      } catch {
        if (!isCancelled) {
          setEvaluator(null);
          setHasEvaluatorError(true);
        }
      } finally {
        if (!isCancelled) setIsEvaluatorPending(false);
      }
    };

    void resolve();

    return () => {
      isCancelled = true;
    };
  }, [evaluatorName, evaluatorVersion]);

  useEffect(() => {
    if (!targetEnrichment) {
      setTarget(null);
      setIsTargetPending(false);
      setHasTargetError(false);
      return;
    }

    const cached = tableCache.current.get(targetEnrichment);
    if (cached) {
      setTarget(cached);
      setIsTargetPending(false);
      setHasTargetError(false);
      return;
    }

    let isCancelled = false;
    setIsTargetPending(true);
    setHasTargetError(false);

    const resolve = async () => {
      try {
        const res = await getTable(targetEnrichment);
        if (isCancelled) return;

        if (res) {
          tableCache.current.set(targetEnrichment, res);
          setTarget(res);
        } else {
          setTarget(null);
          setHasTargetError(true);
        }
      } catch {
        if (!isCancelled) {
          setTarget(null);
          setHasTargetError(true);
        }
      } finally {
        if (!isCancelled) setIsTargetPending(false);
      }
    };

    void resolve();

    return () => {
      isCancelled = true;
    };
  }, [targetEnrichment]);

  const availableTargets = useMemo(() => {
    const taken = new Set(takenTargets);
    return tables.filter((table) => table.type === AnalyticsTableType.Enrichment && !taken.has(table.name));
  }, [tables, takenTargets]);

  const columns = useMemo(() => target?.columns ?? [], [target]);
  const outputVars = useMemo(() => evaluator?.output_vars ?? [], [evaluator]);
  const groupBy = target?.grain?.grain_key ?? '';
  const isBindingsReady = Boolean(evaluator && target);

  const hasReadyWhen = Boolean(form.idle || form.maxStaleness);
  const isCostCeilingValid = !form.costCeiling || /^[1-9]\d*$/.test(form.costCeiling);
  const isCronValid = Boolean(form.triggerCron) && isValidSixFieldCron(form.triggerCron);
  const boundBindings = toOutputBindings(form.bindings);
  const hasStrandedBinding = form.bindings.some((row) =>
    hasBlockingBindingError(getBindingRowError(row, columns, outputVars)),
  );

  const isTriggerSatisfied = useMemo(() => {
    if (form.triggerKind === TriggerKind.Schedule) return isCronValid;
    if (form.triggerKind === TriggerKind.Group) return Boolean(groupBy) && hasReadyWhen && isCostCeilingValid;
    return form.triggerKind === TriggerKind.OnIngest;
  }, [form.triggerKind, isCronValid, groupBy, hasReadyWhen, isCostCeilingValid]);

  const isSqlWithoutBindings = evaluator?.type === EvaluatorType.Sql && boundBindings.length === 0;
  const isLlmWithoutBindings = evaluator?.type === EvaluatorType.Llm && boundBindings.length === 0;

  // A resolution that failed or is still in flight leaves the evaluator's type and the target's columns
  // unknown, so the bindings could not have been checked against anything.
  const isResolved = Boolean(evaluator) && Boolean(target) && !isEvaluatorPending && !isTargetPending;

  const canSubmit =
    Boolean(form.name.trim()) &&
    Boolean(form.evaluatorName) &&
    Boolean(form.targetEnrichment) &&
    form.enabled !== null &&
    isResolved &&
    !hasEvaluatorError &&
    !hasTargetError &&
    isTriggerSatisfied &&
    !isSqlWithoutBindings &&
    !hasStrandedBinding;

  const buildDto = useCallback((): CreateRuleDto => {
    const dto: CreateRuleDto = {
      name: form.name.trim(),
      evaluator_name: form.evaluatorName,
      target_enrichment: form.targetEnrichment,
      trigger_kind: form.triggerKind as TriggerKind,
      enabled: Boolean(form.enabled),
    };

    if (form.evaluatorVersion !== LATEST_VERSION) {
      dto.evaluator_version = Number(form.evaluatorVersion);
    }

    if (form.triggerKind === TriggerKind.Schedule) {
      dto.trigger_cron = form.triggerCron.trim();
    }

    if (form.triggerKind === TriggerKind.Group) {
      dto.group_by = groupBy;

      const readyWhen: ReadyWhen = {};
      if (form.idle) readyWhen.idle = form.idle;
      if (form.maxStaleness) readyWhen.max_staleness = form.maxStaleness;
      if (form.costCeiling) readyWhen.cost_ceiling = Number(form.costCeiling);
      dto.ready_when = readyWhen;
    }

    const bindings = toOutputBindings(form.bindings);
    if (bindings.length) {
      dto.output_bindings = bindings;
    }

    return dto;
  }, [form, groupBy]);

  const setBindings = useCallback((rows: OutputBindingRow[]) => setField('bindings', rows), [setField]);

  return {
    form,
    setField,
    setBindings,
    availableTargets,
    isTablesLoading,
    evaluator,
    columns,
    outputVars,
    groupBy,
    isBindingsReady,
    isEvaluatorPending,
    isTargetPending,
    hasEvaluatorError,
    hasTargetError,
    isCronValid,
    isCostCeilingValid,
    hasReadyWhen,
    isSqlWithoutBindings,
    isLlmWithoutBindings,
    canSubmit,
    buildDto,
  };
};
