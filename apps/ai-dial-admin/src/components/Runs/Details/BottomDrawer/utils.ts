import { RowDetailFieldSchema } from '@/src/components/Runs/Details/RowDetails/models';
import { MetricBinding, MetricBindings } from '@/src/models/evaluation/metric';
import { AnalyticsResult } from '@/src/models/evaluation/run';
import { serializeValue } from '@/src/utils/serialize';

import { ComparisonRow, ComparisonSection } from './models';

const addRecordKeys = (keys: Set<string>, record?: Record<string, unknown>) => {
  if (!record) return;
  Object.keys(record).forEach((key) => keys.add(key));
};

function formatBindingValue(binding: MetricBinding): string {
  const val =
    binding.source.$type === 'Constant' ? String(binding.source.value ?? '') : (binding.source.columnName ?? '');
  return val ? `[${binding.source.$type}] ${val}` : `[${binding.source.$type}]`;
}

function buildRecordRows(
  pinnedRecord: Record<string, unknown> | undefined,
  activeRecord: Record<string, unknown> | undefined,
  isNumeric: boolean,
  hasTwoResults: boolean,
  schemaRecord?: Record<string, unknown>,
): ComparisonRow[] {
  const keys = new Set<string>();
  addRecordKeys(keys, schemaRecord);
  addRecordKeys(keys, pinnedRecord);
  addRecordKeys(keys, activeRecord);

  return [...keys].map((key) => {
    const activeRaw = serializeValue(activeRecord?.[key]);
    const pinnedRaw = serializeValue(pinnedRecord?.[key]);
    const values: ComparisonRow['values'] = hasTwoResults
      ? [{ raw: activeRaw }, { raw: pinnedRaw }]
      : [{ raw: activeRaw }];

    return { fieldKey: key, label: key, isNumeric, values };
  });
}

export function buildComparisonSections(
  active: AnalyticsResult,
  pinned: AnalyticsResult | null,
  fieldVisibility: Record<string, boolean>,
  sectionOrder: string[],
  sectionHidden: Record<string, boolean>,
  activeMetricBindings?: Record<string, MetricBindings>,
  pinnedMetricBindings?: Record<string, MetricBindings>,
  fieldSchema?: RowDetailFieldSchema,
): ComparisonSection[] {
  const isDuplicate = pinned != null && pinned.id === active.id;
  const effectivePinned = isDuplicate ? null : pinned;
  const hasTwoResults = effectivePinned != null;

  const sectionsMap = new Map<string, ComparisonSection>();

  // Execution section — values order: [active/current, pinned/compared] when two results, [active] when single
  const execRows: ComparisonRow[] = [
    {
      fieldKey: 'executionStatus',
      label: 'executionStatus',
      isNumeric: false,
      values: hasTwoResults
        ? [{ raw: active.executionStatus ?? null }, { raw: effectivePinned.executionStatus ?? null }]
        : [{ raw: active.executionStatus ?? null }],
    },
    {
      fieldKey: 'execDurationMs',
      label: 'execDurationMs',
      isNumeric: true,
      values: hasTwoResults
        ? [
            { raw: active.execDurationMs != null ? String(active.execDurationMs) : null },
            { raw: effectivePinned.execDurationMs != null ? String(effectivePinned.execDurationMs) : null },
          ]
        : [{ raw: active.execDurationMs != null ? String(active.execDurationMs) : null }],
    },
  ];
  sectionsMap.set('execution', { key: 'execution', label: 'Execution', rows: execRows });

  // Test Case Data section
  const tcRows = buildRecordRows(
    effectivePinned?.testCaseData,
    active.testCaseData,
    false,
    hasTwoResults,
    fieldSchema?.testCaseData,
  );
  if (tcRows.length > 0) {
    sectionsMap.set('testCaseData', { key: 'testCaseData', label: 'Test Case Data', rows: tcRows });
  }

  // Extracted Columns section
  const ecRows = buildRecordRows(
    effectivePinned?.extractedColumns,
    active.extractedColumns,
    false,
    hasTwoResults,
    fieldSchema?.extractedColumns,
  );
  if (ecRows.length > 0) {
    sectionsMap.set('extractedColumns', { key: 'extractedColumns', label: 'Extracted Columns', rows: ecRows });
  }

  // Request / Response section
  const rrRows: ComparisonRow[] = [];
  const hasRequest = active.requestBody != null || effectivePinned?.requestBody != null;
  const hasResponse = active.responseBody != null || effectivePinned?.responseBody != null;

  if (hasRequest) {
    rrRows.push({
      fieldKey: 'requestBody',
      label: 'requestBody',
      isNumeric: false,
      values: hasTwoResults
        ? [{ raw: serializeValue(active.requestBody) }, { raw: serializeValue(effectivePinned.requestBody) }]
        : [{ raw: serializeValue(active.requestBody) }],
    });
  }
  if (hasResponse) {
    rrRows.push({
      fieldKey: 'responseBody',
      label: 'responseBody',
      isNumeric: false,
      values: hasTwoResults
        ? [{ raw: serializeValue(active.responseBody) }, { raw: serializeValue(effectivePinned.responseBody) }]
        : [{ raw: serializeValue(active.responseBody) }],
    });
  }
  if (rrRows.length > 0) {
    sectionsMap.set('requestResponse', { key: 'requestResponse', label: 'Request / Response', rows: rrRows });
  }

  // Metric sections
  const metricGroupKeys = new Set<string>();
  addRecordKeys(metricGroupKeys, fieldSchema?.metricValues);
  addRecordKeys(metricGroupKeys, active.metricValues);
  addRecordKeys(metricGroupKeys, effectivePinned?.metricValues);

  for (const groupKey of metricGroupKeys) {
    const activeGroup = active.metricValues?.[groupKey];
    const pinnedGroup = effectivePinned?.metricValues?.[groupKey];
    const schemaGroup = fieldSchema?.metricValues?.[groupKey];
    const activeGroupExists = active.metricValues != null && groupKey in active.metricValues;
    const pinnedGroupExists = effectivePinned?.metricValues != null && groupKey in effectivePinned.metricValues;

    const fieldKeys = new Set<string>();
    addRecordKeys(fieldKeys, schemaGroup);
    addRecordKeys(fieldKeys, activeGroup);
    addRecordKeys(fieldKeys, pinnedGroup);

    const rows: ComparisonRow[] = [...fieldKeys].map((fieldKey) => {
      const activeRaw = serializeValue(activeGroup?.[fieldKey]);
      const pinnedRaw = serializeValue(pinnedGroup?.[fieldKey]);
      const values: ComparisonRow['values'] = hasTwoResults
        ? [
            { raw: activeRaw, isFailed: activeGroupExists && activeRaw === null },
            { raw: pinnedRaw, isFailed: pinnedGroupExists && pinnedRaw === null },
          ]
        : [{ raw: activeRaw, isFailed: activeGroupExists && activeRaw === null }];

      return {
        fieldKey,
        label: fieldKey,
        isNumeric:
          typeof activeGroup?.[fieldKey] === 'number' ||
          typeof pinnedGroup?.[fieldKey] === 'number' ||
          typeof schemaGroup?.[fieldKey] === 'number',
        values,
      };
    });

    const sectionKey = `metric:${groupKey}`;
    sectionsMap.set(sectionKey, { key: sectionKey, label: groupKey, rows });
  }

  // Binding sections (config and input) per metric group
  const allBindingGroupKeys = new Set<string>();
  if (activeMetricBindings) Object.keys(activeMetricBindings).forEach((k) => allBindingGroupKeys.add(k));
  if (pinnedMetricBindings) Object.keys(pinnedMetricBindings).forEach((k) => allBindingGroupKeys.add(k));

  for (const groupKey of [...allBindingGroupKeys].sort()) {
    const activeBindings = activeMetricBindings?.[groupKey];
    const pinnedBindings = hasTwoResults ? pinnedMetricBindings?.[groupKey] : undefined;
    const activeHasMetric = active.metricValues?.[groupKey] != null;
    const pinnedHasMetric = effectivePinned?.metricValues?.[groupKey] != null;

    const configProps = new Set<string>();
    activeBindings?.configBindings.forEach((b) => configProps.add(b.property));
    pinnedBindings?.configBindings.forEach((b) => configProps.add(b.property));

    if (configProps.size > 0) {
      const sectionKey = `binding:config:${groupKey}`;
      const rows: ComparisonRow[] = [...configProps].sort().map((prop) => {
        const activeBinding = activeBindings?.configBindings.find((b) => b.property === prop);
        const pinnedBinding = pinnedBindings?.configBindings.find((b) => b.property === prop);
        const values: ComparisonRow['values'] = hasTwoResults
          ? [
              { raw: activeHasMetric && activeBinding ? formatBindingValue(activeBinding) : null },
              { raw: pinnedHasMetric && pinnedBinding ? formatBindingValue(pinnedBinding) : null },
            ]
          : [{ raw: activeBinding ? formatBindingValue(activeBinding) : null }];
        return { fieldKey: prop, label: prop, isNumeric: false, values };
      });
      sectionsMap.set(sectionKey, { key: sectionKey, label: `${groupKey} · Config bindings`, rows });
    }

    const inputProps = new Set<string>();
    activeBindings?.inputBindings.forEach((b) => inputProps.add(b.property));
    pinnedBindings?.inputBindings.forEach((b) => inputProps.add(b.property));

    if (inputProps.size > 0) {
      const sectionKey = `binding:input:${groupKey}`;
      const rows: ComparisonRow[] = [...inputProps].sort().map((prop) => {
        const activeBinding = activeBindings?.inputBindings.find((b) => b.property === prop);
        const pinnedBinding = pinnedBindings?.inputBindings.find((b) => b.property === prop);
        const values: ComparisonRow['values'] = hasTwoResults
          ? [
              { raw: activeHasMetric && activeBinding ? formatBindingValue(activeBinding) : null },
              { raw: pinnedHasMetric && pinnedBinding ? formatBindingValue(pinnedBinding) : null },
            ]
          : [{ raw: activeBinding ? formatBindingValue(activeBinding) : null }];
        return { fieldKey: prop, label: prop, isNumeric: false, values };
      });
      sectionsMap.set(sectionKey, { key: sectionKey, label: `${groupKey} · Input bindings`, rows });
    }
  }

  // Apply field visibility filtering (create new section objects to avoid mutation)
  for (const [key, section] of sectionsMap) {
    const filteredRows = section.rows.filter((row) => {
      const visKey = `${section.key}:${row.fieldKey}`;
      return fieldVisibility[visKey] !== false;
    });
    sectionsMap.set(key, { ...section, rows: filteredRows });
  }

  // Apply section hidden
  for (const [key] of sectionsMap) {
    if (sectionHidden[key]) {
      sectionsMap.delete(key);
    }
  }

  // Apply section order
  const ordered: ComparisonSection[] = [];
  const usedKeys = new Set<string>();

  for (const key of sectionOrder) {
    const section = sectionsMap.get(key);
    if (section) {
      ordered.push(section);
      usedKeys.add(key);
    }
  }

  // Add remaining sections not in the order list
  for (const [key, section] of sectionsMap) {
    if (!usedKeys.has(key)) {
      ordered.push(section);
    }
  }

  return ordered;
}

export function formatFieldValue(raw: string | null): string {
  if (raw === null) return '—';
  return raw;
}

function tryParseNumber(value: string): number | null {
  const n = Number(value);
  return isNaN(n) ? null : n;
}

function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = sortKeys((obj as Record<string, unknown>)[key]);
          return acc;
        },
        {} as Record<string, unknown>,
      );
  }
  return obj;
}

function normalizeJson(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    return JSON.stringify(sortKeys(JSON.parse(trimmed)));
  } catch {
    return null;
  }
}

export function valuesAreEqual(a: string | null, b: string | null): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;

  // JSON normalization (check before numeric since JSON strings can start with digits in edge cases)
  const jsonA = normalizeJson(a);
  const jsonB = normalizeJson(b);
  if (jsonA !== null && jsonB !== null) return jsonA === jsonB;

  // Numeric normalization
  const numA = tryParseNumber(a);
  const numB = tryParseNumber(b);
  if (numA !== null && numB !== null) return numA === numB;

  return false;
}
