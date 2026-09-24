'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getTable, getTables } from '@/src/app/[lang]/pipelines/actions';
import { getEntitySchema } from '@/src/app/[lang]/queries/actions';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

interface Params {
  target?: string;
  input?: string;
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
 * The read source is the declared input or the target enrichment's `source_table`, so it cannot be
 * resolved until the target has been.
 *
 * Three reads, easy to conflate. The transform's inputs, every SQL predicate and the member ranking are
 * scoped to the source's **entity** — the source with its enrichments flattened in, which is what the
 * service accepts and where `<enrichment>.<column>` comes from. An aggregate's group keys and measure
 * inputs are scoped to the source **table**, which the entity would wrongly widen. A measure's name and
 * an output's target column are written against the **target table's** columns.
 */
export const usePipelineResolution = ({ target: targetName, input }: Params) => {
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

  const resolveTable = useCallback((name: string): Promise<AnalyticsTable | null> => getTable(name), []);

  const resolveEntity = useCallback(async (name: string): Promise<AnalyticsEntityField[] | null> => {
    const read = await getEntitySchema(name);
    return read.response?.fields ?? null;
  }, []);

  const target = useCachedResolution(targetName, resolveTable);

  const sourceName = input || target.value?.source_table;
  const readSource = useCachedResolution(sourceName, resolveTable);
  const sourceEntity = useCachedResolution(sourceName, resolveEntity);

  const enrichmentTables = useMemo(
    () => tables.filter((table) => table.type === AnalyticsTableType.Enrichment),
    [tables],
  );

  return {
    tables,
    enrichmentTables,
    isTablesLoading,
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
    sourceFields: sourceEntity.value ?? [],
    isSourceEntityPending: sourceEntity.isPending,
    hasSourceEntityError: sourceEntity.hasError,
  };
};
