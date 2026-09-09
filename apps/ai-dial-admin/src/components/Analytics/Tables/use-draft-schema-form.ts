import { useCallback, useMemo, useState } from 'react';

import {
  buildDraftSchemaDto,
  createDraftSchemaForm,
  getColumnRowErrors,
  getIdentityColumnNames,
  getSourceColumnNames,
  getTemporalColumnNames,
  getVersionColumnNames,
  hasColumnRowErrors,
  toTableColumns,
} from '@/src/components/Analytics/Tables/utils';
import { AnalyticsTable, AnalyticsTableType, DraftSchemaDto } from '@/src/models/analytics/table';
import { DraftSchemaForm } from '@/src/models/analytics/tables-ui';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';

type Translate = (key: string, args?: Record<string, string | number>) => string;

interface UseDraftSchemaFormReturn {
  form: DraftSchemaForm;
  update: <K extends keyof DraftSchemaForm>(key: K, value: DraftSchemaForm[K]) => void;
  columnOptions: { value: string; label: string }[];
  temporalNames: string[];
  identityNames: string[];
  versionNames: string[];
  grainOptions: { value: string; label: string }[];
  columnErrors: ReturnType<typeof getColumnRowErrors>;
  // The definition already stores a scan-metadata member, which a re-post cannot clear — so neither half may
  // be left empty on re-submission.
  scanPairRequired: boolean;
  scanPairIncomplete: boolean;
  canMaterialize: boolean;
  buildDto: () => DraftSchemaDto;
  // The DTO the table's stored definition yields — what the live one is compared against, and what the
  // detail view seeds its JSON document from.
  baselineDto: DraftSchemaDto;
  isChanged: boolean;
  reset: () => void;
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
      // Same for the scan-metadata pair, which a rename, removal, retype, or a flip to nullable/sensitive can
      // invalidate — buildDto must never emit a stale or now-unusable column name.
      if (key === 'columns') {
        if (next.identityColumn && !getIdentityColumnNames(next.columns).includes(next.identityColumn)) {
          next.identityColumn = '';
        }
        if (next.versionColumn && !getVersionColumnNames(next.columns).includes(next.versionColumn)) {
          next.versionColumn = '';
        }
      }
      return next;
    });

  const sourceNames = useMemo(() => getSourceColumnNames(form.columns), [form.columns]);
  const columnOptions = sourceNames.map((s) => ({ value: s, label: s }));

  const temporalNames = useMemo(() => getTemporalColumnNames(form.columns), [form.columns]);
  const identityNames = useMemo(() => getIdentityColumnNames(form.columns), [form.columns]);
  const versionNames = useMemo(() => getVersionColumnNames(form.columns), [form.columns]);

  const grainOptions = (sourceTable?.columns ?? []).map((c) => ({ value: c.source_name, label: c.source_name }));

  const columnErrors = getColumnRowErrors(form.columns, { sourceNames: [], names: [] }, t);
  const invalidColumns = hasColumnRowErrors(columnErrors);
  const validColumns = toTableColumns(form.columns);
  const validOrdering = form.orderingKey.filter((k) => sourceNames.includes(k));

  const scanPairRequired = Boolean(table.identity_column || table.version_column);
  // The scan needs both halves, and the backend accepts one alone — which materializes a source that is
  // permanently unscannable, since POST answers 409 once ACTIVE and no PATCH member sets the pair.
  const scanPairIncomplete =
    isSource &&
    (Boolean(form.identityColumn) !== Boolean(form.versionColumn) ||
      (scanPairRequired && !(form.identityColumn && form.versionColumn)));

  const canMaterialize = isSource
    ? !invalidColumns && validColumns.length > 0 && validOrdering.length > 0 && !scanPairIncomplete
    : !invalidColumns && Boolean(form.grainKey.trim());

  const buildDto = (): DraftSchemaDto => buildDraftSchemaDto(form, table.type);

  // Baseline and reset both track `table`, while the form itself stays seeded once: `table` is state in
  // the detail view and is refetched after a successful save, and "changed" means "what would be
  // submitted differs from what is stored *now*" — the same state Discard restores to. Nothing here
  // rewrites the form on its own, so a refetch can never overwrite what the author has typed; only an
  // explicit Discard calls `reset`.
  const baselineDto = useMemo(() => buildDraftSchemaDto(createDraftSchemaForm(table), table.type), [table]);

  // Built DTOs, never the forms: `createDraftSchemaForm` mints a fresh `ColumnRow.id` per call, so a
  // form-to-form comparison would report a change that never goes away (design.md D9).
  const isChanged = useMemo(
    () => !isEqualSkippingUndefined(buildDraftSchemaDto(form, table.type), baselineDto),
    [form, table.type, baselineDto],
  );

  const reset = useCallback(() => setForm(createDraftSchemaForm(table)), [table]);

  return {
    form,
    update,
    columnOptions,
    temporalNames,
    identityNames,
    versionNames,
    grainOptions,
    columnErrors,
    scanPairRequired,
    scanPairIncomplete,
    canMaterialize,
    buildDto,
    baselineDto,
    isChanged,
    reset,
  };
};
