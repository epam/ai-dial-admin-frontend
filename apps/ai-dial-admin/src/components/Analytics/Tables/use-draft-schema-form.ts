import { useCallback, useMemo, useState } from 'react';

import {
  buildDraftSchemaDto,
  createDraftSchemaForm,
  getColumnRowErrors,
  getGrainKeyColumnNames,
  getIdentityColumnNames,
  getOrderingKeyColumnNames,
  getPartitionColumnNames,
  getVersionColumnNames,
  hasColumnRowErrors,
  reconcileKeySelections,
  toTableColumns,
} from '@/src/components/Analytics/Tables/utils';
import { AnalyticsTable, AnalyticsTableType, DraftSchemaDto } from '@/src/models/analytics/table';
import { DraftSchemaForm } from '@/src/models/analytics/tables-ui';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';

type Translate = (key: string, args?: Record<string, string | number>) => string;

interface UseDraftSchemaFormReturn {
  form: DraftSchemaForm;
  update: <K extends keyof DraftSchemaForm>(key: K, value: DraftSchemaForm[K]) => void;
  orderingOptions: { value: string; label: string }[];
  partitionNames: string[];
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
      return key === 'columns' ? { ...next, ...reconcileKeySelections(prev.columns, next.columns, next) } : next;
    });

  const orderingNames = useMemo(() => getOrderingKeyColumnNames(form.columns), [form.columns]);
  const orderingOptions = orderingNames.map((s) => ({ value: s, label: s }));

  const partitionNames = useMemo(() => getPartitionColumnNames(form.columns), [form.columns]);
  // The column chosen for one role is not offered for the other: a shared column would make the version its own
  // tiebreaker, and rows with an equal version could then be skipped by the incremental scan.
  const identityNames = useMemo(
    () => getIdentityColumnNames(form.columns).filter((name) => name !== form.versionColumn),
    [form.columns, form.versionColumn],
  );
  const versionNames = useMemo(
    () => getVersionColumnNames(form.columns).filter((name) => name !== form.identityColumn),
    [form.columns, form.identityColumn],
  );

  const grainOptions = getGrainKeyColumnNames(sourceTable?.columns ?? []).map((s) => ({ value: s, label: s }));

  const columnErrors = getColumnRowErrors(form.columns, { sourceNames: [], names: [] }, t);
  const invalidColumns = hasColumnRowErrors(columnErrors);
  const validColumns = toTableColumns(form.columns);
  const validOrdering = form.orderingKey.filter((k) => orderingNames.includes(k));

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
    orderingOptions,
    partitionNames,
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
