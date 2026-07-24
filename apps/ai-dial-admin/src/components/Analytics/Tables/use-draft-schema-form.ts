import { useMemo, useState } from 'react';

import {
  createDraftSchemaForm,
  getColumnRowErrors,
  getTemporalColumnNames,
  hasColumnRowErrors,
  toTableColumns,
} from '@/src/components/Analytics/Tables/utils';
import { AnalyticsTable, AnalyticsTableType, Cardinality, DraftSchemaDto } from '@/src/models/analytics/table';
import { DraftSchemaForm } from '@/src/models/analytics/tables-ui';

type Translate = (key: string, args?: Record<string, string | number>) => string;

interface UseDraftSchemaFormReturn {
  form: DraftSchemaForm;
  update: <K extends keyof DraftSchemaForm>(key: K, value: DraftSchemaForm[K]) => void;
  columnOptions: { value: string; label: string }[];
  temporalNames: string[];
  grainOptions: { value: string; label: string }[];
  columnErrors: ReturnType<typeof getColumnRowErrors>;
  canMaterialize: boolean;
  buildDto: () => DraftSchemaDto;
}

export const useDraftSchemaForm = (
  table: AnalyticsTable,
  sourceTable: AnalyticsTable | null | undefined,
  t: Translate,
): UseDraftSchemaFormReturn => {
  const isSource = table.type === AnalyticsTableType.Source;

  const [form, setForm] = useState<DraftSchemaForm>(() => createDraftSchemaForm(table));

  const update = <K extends keyof DraftSchemaForm>(key: K, value: DraftSchemaForm[K]) =>
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Retyping a column away from Date/Timestamp can invalidate an already-selected partition
      // column; without this it silently keeps its (now stale) granularity selection too.
      if (
        key === 'columns' &&
        next.partitionColumn &&
        !getTemporalColumnNames(next.columns).includes(next.partitionColumn)
      ) {
        next.partitionColumn = '';
        next.granularity = '';
      }
      return next;
    });

  const sourceNames = useMemo(() => {
    const seen = new Set<string>();
    form.columns.forEach((c) => {
      const s = c.source_name.trim();
      if (s) seen.add(s);
    });
    return [...seen];
  }, [form.columns]);
  const columnOptions = sourceNames.map((s) => ({ value: s, label: s }));

  const temporalNames = useMemo(() => getTemporalColumnNames(form.columns), [form.columns]);

  const grainOptions = (sourceTable?.columns ?? []).map((c) => ({ value: c.source_name, label: c.source_name }));

  const columnErrors = getColumnRowErrors(form.columns, { sourceNames: [], names: [] }, t);
  const invalidColumns = hasColumnRowErrors(columnErrors);
  const validColumns = toTableColumns(form.columns);
  const validOrdering = form.orderingKey.filter((k) => sourceNames.includes(k));

  const canMaterialize = isSource
    ? !invalidColumns && validColumns.length > 0 && validOrdering.length > 0
    : !invalidColumns && Boolean(form.grainKey.trim());

  const buildDto = (): DraftSchemaDto =>
    isSource
      ? {
          columns: validColumns,
          ...(validOrdering.length ? { ordering_key: validOrdering } : {}),
          ...(form.partitionColumn && form.granularity && temporalNames.includes(form.partitionColumn)
            ? { partition_by: { column: form.partitionColumn, granularity: form.granularity } }
            : {}),
        }
      : {
          columns: validColumns,
          ...(form.grainKey.trim() ? { grain_key: form.grainKey.trim() } : {}),
          cardinality: Cardinality.ZeroOrOne,
        };

  return { form, update, columnOptions, temporalNames, grainOptions, columnErrors, canMaterialize, buildDto };
};
