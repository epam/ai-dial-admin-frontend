'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getTable, getTables } from '@/src/app/[lang]/enrichment-rules/actions';
import { getEvaluator, getEvaluatorVersion } from '@/src/app/[lang]/evaluators/actions';
import { LATEST_VERSION } from '@/src/constants/analytics/enrichment-rules';
import { Evaluator } from '@/src/models/analytics/evaluator';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

interface Params {
  evaluatorName?: string;
  // Absent means "latest"; the sentinel stays inside this hook.
  evaluatorVersion?: number;
  targetEnrichment?: string;
  source?: string;
}

interface Resolved<T> {
  value: T | null;
  isPending: boolean;
  hasError: boolean;
}

const idle = <T>(): Resolved<T> => ({ value: null, isPending: false, hasError: false });

// Keyed so re-selecting a previously chosen entity issues no second request; the cache dies with the surface.
const useCachedResolution = <T>(key: string | undefined, resolve: (key: string) => Promise<T | null>) => {
  const [state, setState] = useState<Resolved<T>>(idle<T>);
  const cache = useRef(new Map<string, T>());

  useEffect(() => {
    if (!key) {
      setState(idle<T>());
      return;
    }

    const cached = cache.current.get(key);
    if (cached) {
      setState({ value: cached, isPending: false, hasError: false });
      return;
    }

    let isCancelled = false;
    setState({ value: null, isPending: true, hasError: false });

    const run = async () => {
      try {
        const res = await resolve(key);
        if (res) cache.current.set(key, res);
        if (isCancelled) return;

        if (res) {
          setState({ value: res, isPending: false, hasError: false });
        } else {
          setState({ value: null, isPending: false, hasError: true });
        }
      } catch {
        if (!isCancelled) setState({ value: null, isPending: false, hasError: true });
      }
    };

    void run();

    return () => {
      isCancelled = true;
    };
  }, [key, resolve]);

  return state;
};

/**
 * The three legs are a chain, not parallel: the read source is the rule's declared `source` or the target
 * enrichment's `source_table`, so it cannot be resolved until the target has been.
 *
 * Output bindings are written against the **target's** columns; input bindings and every SQL predicate are
 * read against the **source's**. Conflating the two is the likeliest way to get this wrong.
 */
export const useRuleResolution = ({ evaluatorName, evaluatorVersion, targetEnrichment, source }: Params) => {
  const [tables, setTables] = useState<AnalyticsTable[]>([]);
  const [isTablesLoading, setIsTablesLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        const list = await getTables();
        if (!isCancelled && Array.isArray(list)) setTables(list);
      } catch {
        // Leaves the table lists empty; the selects then state they have nothing to offer.
      } finally {
        if (!isCancelled) setIsTablesLoading(false);
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, []);

  const evaluatorKey = evaluatorName ? `${evaluatorName}@${evaluatorVersion ?? LATEST_VERSION}` : undefined;

  const resolveEvaluator = useCallback((key: string): Promise<Evaluator | null> => {
    const [name, version] = key.split('@');
    return version === LATEST_VERSION ? getEvaluator(name) : getEvaluatorVersion(name, Number(version));
  }, []);

  const resolveTable = useCallback((name: string): Promise<AnalyticsTable | null> => getTable(name), []);

  const evaluator = useCachedResolution(evaluatorKey, resolveEvaluator);
  const target = useCachedResolution(targetEnrichment, resolveTable);

  const sourceName = source || target.value?.source_table;
  const readSource = useCachedResolution(sourceName, resolveTable);

  const enrichmentTables = useMemo(
    () => tables.filter((table) => table.type === AnalyticsTableType.Enrichment),
    [tables],
  );

  return {
    tables,
    enrichmentTables,
    isTablesLoading,
    evaluator: evaluator.value,
    isEvaluatorPending: evaluator.isPending,
    hasEvaluatorError: evaluator.hasError,
    target: target.value,
    isTargetPending: target.isPending,
    hasTargetError: target.hasError,
    readSource: readSource.value,
    isSourcePending: readSource.isPending,
    hasSourceError: readSource.hasError,
    sourceName,
    grainKey: target.value?.grain?.grain_key ?? '',
    targetColumns: target.value?.columns ?? [],
    sourceColumns: readSource.value?.columns ?? [],
    outputVars: evaluator.value?.output_vars ?? [],
    inputVars: evaluator.value?.input_vars ?? [],
  };
};
