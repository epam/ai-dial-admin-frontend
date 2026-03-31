import { AnalyticsResult } from '@/src/models/evaluation/run';

import { ComparisonRow, ComparisonSection } from './types';

function serializeValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value, null, 2);
}

function buildRecordRows(
  recordA: Record<string, unknown> | undefined,
  recordB: Record<string, unknown> | undefined,
  isNumeric: boolean,
  hasTwoResults: boolean,
): ComparisonRow[] {
  const keys = new Set<string>();
  if (recordA) Object.keys(recordA).forEach((k) => keys.add(k));
  if (recordB) Object.keys(recordB).forEach((k) => keys.add(k));

  return [...keys].sort().map((key) => {
    const rawA = serializeValue(recordA?.[key]);
    const rawB = hasTwoResults ? serializeValue(recordB?.[key]) : undefined;

    const values: ComparisonRow['values'] = [{ raw: rawA, display: null }];
    if (hasTwoResults) {
      values.push({ raw: rawB!, display: null });
    }

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

  // Execution section
  const execRows: ComparisonRow[] = [
    {
      fieldKey: 'executionStatus',
      label: 'executionStatus',
      isNumeric: false,
      values: [
        { raw: active.executionStatus ?? null, display: null },
        ...(hasTwoResults ? [{ raw: effectivePinned.executionStatus ?? null, display: null }] : []),
      ],
    },
    {
      fieldKey: 'execDurationMs',
      label: 'execDurationMs',
      isNumeric: true,
      values: [
        { raw: active.execDurationMs != null ? String(active.execDurationMs) : null, display: null },
        ...(hasTwoResults
          ? [
              {
                raw: effectivePinned.execDurationMs != null ? String(effectivePinned.execDurationMs) : null,
                display: null,
              },
            ]
          : []),
      ],
    },
  ];
  sectionsMap.set('execution', { key: 'execution', label: 'Execution', rows: execRows });

  // Test Case Data section
  const tcRows = buildRecordRows(active.testCaseData, effectivePinned?.testCaseData, false, hasTwoResults);
  if (tcRows.length > 0) {
    sectionsMap.set('testCaseData', { key: 'testCaseData', label: 'Test Case Data', rows: tcRows });
  }

  // Extracted Columns section
  const ecRows = buildRecordRows(active.extractedColumns, effectivePinned?.extractedColumns, false, hasTwoResults);
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
      values: [
        { raw: serializeValue(active.requestBody), display: null },
        ...(hasTwoResults ? [{ raw: serializeValue(effectivePinned.requestBody), display: null }] : []),
      ],
    });
  }
  if (hasResponse) {
    rrRows.push({
      fieldKey: 'responseBody',
      label: 'responseBody',
      isNumeric: false,
      values: [
        { raw: serializeValue(active.responseBody), display: null },
        ...(hasTwoResults ? [{ raw: serializeValue(effectivePinned.responseBody), display: null }] : []),
      ],
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
      const rawA = serializeValue(activeGroup?.[fieldKey]);
      const rawB = hasTwoResults ? serializeValue(pinnedGroup?.[fieldKey]) : undefined;

      const values: ComparisonRow['values'] = [{ raw: rawA, display: null }];
      if (hasTwoResults) {
        values.push({ raw: rawB!, display: null });
      }

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

  // Apply field visibility filtering
  for (const [, section] of sectionsMap) {
    section.rows = section.rows.filter((row) => {
      const visKey = `${section.key}:${row.fieldKey}`;
      return fieldVisibility[visKey] !== false;
    });
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
