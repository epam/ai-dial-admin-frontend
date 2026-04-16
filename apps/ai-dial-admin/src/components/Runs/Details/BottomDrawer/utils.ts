import { AnalyticsResult } from '@/src/models/evaluation/run';
import { serializeValue } from '@/src/utils/serialize';

import { ComparisonRow, ComparisonSection } from './models';

function buildRecordRows(
  pinnedRecord: Record<string, unknown> | undefined,
  activeRecord: Record<string, unknown> | undefined,
  isNumeric: boolean,
  hasTwoResults: boolean,
): ComparisonRow[] {
  const keys = new Set<string>();
  if (pinnedRecord) Object.keys(pinnedRecord).forEach((k) => keys.add(k));
  if (activeRecord) Object.keys(activeRecord).forEach((k) => keys.add(k));

  return [...keys].sort().map((key) => {
    const values: ComparisonRow['values'] = hasTwoResults
      ? [{ raw: serializeValue(pinnedRecord?.[key]) }, { raw: serializeValue(activeRecord?.[key]) }]
      : [{ raw: serializeValue(activeRecord?.[key]) }];

    return { fieldKey: key, label: key, isNumeric, values };
  });
}

export function buildComparisonSections(
  active: AnalyticsResult,
  pinned: AnalyticsResult | null,
  fieldVisibility: Record<string, boolean>,
  sectionOrder: string[],
  sectionHidden: Record<string, boolean>,
): ComparisonSection[] {
  const isDuplicate = pinned != null && pinned.id === active.id;
  const effectivePinned = isDuplicate ? null : pinned;
  const hasTwoResults = effectivePinned != null;

  const sectionsMap = new Map<string, ComparisonSection>();

  // Execution section — values order: [pinned, active] when two results, [active] when single
  const execRows: ComparisonRow[] = [
    {
      fieldKey: 'executionStatus',
      label: 'executionStatus',
      isNumeric: false,
      values: hasTwoResults
        ? [{ raw: effectivePinned.executionStatus ?? null }, { raw: active.executionStatus ?? null }]
        : [{ raw: active.executionStatus ?? null }],
    },
    {
      fieldKey: 'execDurationMs',
      label: 'execDurationMs',
      isNumeric: true,
      values: hasTwoResults
        ? [
            { raw: effectivePinned.execDurationMs != null ? String(effectivePinned.execDurationMs) : null },
            { raw: active.execDurationMs != null ? String(active.execDurationMs) : null },
          ]
        : [{ raw: active.execDurationMs != null ? String(active.execDurationMs) : null }],
    },
  ];
  sectionsMap.set('execution', { key: 'execution', label: 'Execution', rows: execRows });

  // Test Case Data section
  const tcRows = buildRecordRows(effectivePinned?.testCaseData, active.testCaseData, false, hasTwoResults);
  if (tcRows.length > 0) {
    sectionsMap.set('testCaseData', { key: 'testCaseData', label: 'Test Case Data', rows: tcRows });
  }

  // Extracted Columns section
  const ecRows = buildRecordRows(effectivePinned?.extractedColumns, active.extractedColumns, false, hasTwoResults);
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
        ? [{ raw: serializeValue(effectivePinned.requestBody) }, { raw: serializeValue(active.requestBody) }]
        : [{ raw: serializeValue(active.requestBody) }],
    });
  }
  if (hasResponse) {
    rrRows.push({
      fieldKey: 'responseBody',
      label: 'responseBody',
      isNumeric: false,
      values: hasTwoResults
        ? [{ raw: serializeValue(effectivePinned.responseBody) }, { raw: serializeValue(active.responseBody) }]
        : [{ raw: serializeValue(active.responseBody) }],
    });
  }
  if (rrRows.length > 0) {
    sectionsMap.set('requestResponse', { key: 'requestResponse', label: 'Request / Response', rows: rrRows });
  }

  // Metric sections
  const metricGroupKeys = new Set<string>();
  if (active.metricValues) Object.keys(active.metricValues).forEach((k) => metricGroupKeys.add(k));
  if (effectivePinned?.metricValues) Object.keys(effectivePinned.metricValues).forEach((k) => metricGroupKeys.add(k));

  for (const groupKey of [...metricGroupKeys].sort()) {
    const activeGroup = active.metricValues?.[groupKey];
    const pinnedGroup = effectivePinned?.metricValues?.[groupKey];

    const fieldKeys = new Set<string>();
    if (activeGroup) Object.keys(activeGroup).forEach((k) => fieldKeys.add(k));
    if (pinnedGroup) Object.keys(pinnedGroup).forEach((k) => fieldKeys.add(k));

    const rows: ComparisonRow[] = [...fieldKeys].sort().map((fieldKey) => {
      const values: ComparisonRow['values'] = hasTwoResults
        ? [{ raw: serializeValue(pinnedGroup?.[fieldKey]) }, { raw: serializeValue(activeGroup?.[fieldKey]) }]
        : [{ raw: serializeValue(activeGroup?.[fieldKey]) }];

      return {
        fieldKey,
        label: fieldKey,
        isNumeric: typeof activeGroup?.[fieldKey] === 'number' || typeof pinnedGroup?.[fieldKey] === 'number',
        values,
      };
    });

    const sectionKey = `metric:${groupKey}`;
    sectionsMap.set(sectionKey, { key: sectionKey, label: groupKey, rows });
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

export function getDiffClass(row: ComparisonRow): string {
  if (row.values.length < 2) return '';
  const [pinned, active] = row.values;
  if (valuesAreEqual(pinned.raw, active.raw)) return '';
  return row.isNumeric ? 'bg-warning' : 'bg-accent-secondary-alpha';
}

export function countDiffs(sections: ComparisonSection[]): number {
  let count = 0;
  for (const section of sections) {
    for (const row of section.rows) {
      if (row.values.length < 2) continue;
      if (!valuesAreEqual(row.values[0].raw, row.values[1].raw)) {
        count++;
      }
    }
  }
  return count;
}
