import { EntityParameterKeys } from '@/src/components/ActivityAudit/constants';
import { CompareI18nKey } from '@/src/constants/i18n';
import {
  ActivityAuditDiff,
  ActivityAuditDiffSection,
  ActivityAuditSection,
  FlatRow,
  TranslateFn,
} from '@/src/models/activity-audit';
import { ActivityAuditEntity, DiffStatus } from '@/src/types/activity-audit';
import { sortKeys } from './compare-helpers';
import { compareNestedFlatObject, fillNestedFlatObject } from './create-simple-diffs';

// Attributes an analytics table column carries, in render order. Exported so the
// row-label map can be asserted to cover every one of them.
export const ANALYTICS_COLUMN_PARAMETERS = [
  'name',
  'type',
  'element_type',
  'enum_values',
  'nullable',
  'tag',
  'display_name',
  'description',
  'sensitive',
];

const COLUMN_NAME_PARAMETER = 'name';
const COLUMNS_BUCKET_PREFIX = `${EntityParameterKeys.COLUMNS}:`;
const PATH_SEPARATOR = '.';
const VALUE_SEPARATOR = ', ';

const toLeafValue = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'object') return '';
  return String(value);
};

const isScalar = (value: unknown): boolean => value == null || typeof value !== 'object';

const collectLeaves = (value: unknown, path: string, leaves: Record<string, string>): void => {
  if (isScalar(value)) {
    leaves[path] = toLeafValue(value);
    return;
  }
  if (Array.isArray(value)) {
    // Scalar arrays join in the snapshot's own order: `ordering_key` and
    // `tag_order` are ordered fields whose order is their meaning, so sorting
    // them would render a reordering as no change at all.
    if (value.every(isScalar)) {
      leaves[path] = value.map(toLeafValue).join(VALUE_SEPARATOR);
      return;
    }
    value.forEach((item, index) => collectLeaves(item, `${path}${PATH_SEPARATOR}${index}`, leaves));
    return;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) {
    leaves[path] = '';
    return;
  }
  entries.forEach(([key, item]) => collectLeaves(item, path ? `${path}${PATH_SEPARATOR}${key}` : key, leaves));
};

const toColumnValue = (value: unknown): string | undefined => {
  if (value == null) return undefined;
  // `enum_values` and its siblings keep the order the column lists them in.
  if (Array.isArray(value)) return value.map((item) => toColumnValue(item) ?? '').join(VALUE_SEPARATOR);
  if (typeof value === 'object') {
    const leaves: Record<string, string> = {};
    collectLeaves(value, '', leaves);
    return Object.entries(leaves)
      .map(([parameter, leaf]) => `${parameter}: ${leaf}`)
      .join(VALUE_SEPARATOR);
  }
  return String(value);
};

/**
 * Flatten every field of a snapshot other than `columns` to a map of dotted
 * parameter path to rendered value.
 *
 * @param {?ActivityAuditEntity} [snapshot] - analytics revision snapshot
 * @returns {Record<string, string>} - leaf parameter path to value
 */
export const getSnapshotLeaves = (snapshot?: ActivityAuditEntity | null): Record<string, string> => {
  const leaves: Record<string, string> = {};
  Object.entries(snapshot ?? {}).forEach(([key, value]) => {
    if (key === EntityParameterKeys.COLUMNS) return;
    collectLeaves(value, key, leaves);
  });
  return leaves;
};

/**
 * Project a snapshot to diff rows — one per leaf, no hidden-key set.
 *
 * @param {?ActivityAuditEntity} [snapshot] - analytics revision snapshot
 * @param {?string[]} [parameters] - parameter order to emit; both sides of a
 *   comparison must be projected against the same list, since
 *   `compareNestedFlatObject` pairs rows by index
 * @returns {FlatRow[]} - rows ready for the nested-flat comparator
 */
export const snapshotRows = (snapshot?: ActivityAuditEntity | null, parameters?: string[]): FlatRow[] => {
  const leaves = getSnapshotLeaves(snapshot);
  const emittedParameters = parameters ?? Object.keys(leaves).sort(sortKeys);
  return emittedParameters.map((parameter) => ({ parameter, value: leaves[parameter] }));
};

/**
 * Project one column to diff rows.
 *
 * @param {?object} [column] - column object from a snapshot's `columns` array
 * @param {?string[]} [extraParameters] - attributes beyond the known ones, so a
 *   field the backend adds later renders unlabelled rather than being dropped
 * @returns {FlatRow[]} - rows ready for the nested-flat comparator
 */
export const columnRows = (column?: object | null, extraParameters: string[] = []): FlatRow[] => {
  const source = (column ?? {}) as Record<string, unknown>;
  return [...ANALYTICS_COLUMN_PARAMETERS, ...extraParameters].map((parameter) => ({
    parameter,
    value: toColumnValue(source[parameter]),
  }));
};

const getColumnsByName = (snapshot?: ActivityAuditEntity | null): Record<string, object> => {
  const columns = snapshot?.[EntityParameterKeys.COLUMNS];
  if (!Array.isArray(columns)) return {};
  const byName: Record<string, object> = {};
  columns.forEach((column, index) => {
    if (column == null || typeof column !== 'object') return;
    const name = (column as Record<string, unknown>)[COLUMN_NAME_PARAMETER];
    byName[typeof name === 'string' && name ? name : `#${index}`] = column as object;
  });
  return byName;
};

const getExtraColumnParameters = (...columns: (object | undefined)[]): string[] => {
  const extra = new Set<string>();
  columns.forEach((column) => {
    Object.keys(column ?? {}).forEach((parameter) => {
      if (!ANALYTICS_COLUMN_PARAMETERS.includes(parameter)) extra.add(parameter);
    });
  });
  return Array.from(extra).sort();
};

const union = (...keyLists: string[][]): string[] => Array.from(new Set(keyLists.flat()));

/**
 * Restore rows the shared comparator dropped for having an empty rendered
 * value — the case an empty collection (`inputs: []`) or an all-empty nested
 * object falls into, since `collectLeaves` renders both as `''`. The
 * comparator's own drop rule stays untouched for every other caller; this
 * only re-inserts a plain, unchanged-looking row for a parameter this
 * snapshot actually carries, so an analytics field is never silently absent.
 *
 * @param {ActivityAuditDiff[]} rows - output of `compareNestedFlatObject` / `fillNestedFlatObject`,
 *   a subsequence of `parameters` in the same order
 * @param {string[]} parameters - every parameter the snapshot(s) carry, in emission order
 * @returns {ActivityAuditDiff[]} - one row per parameter, gaps filled with an empty value
 */
const restoreEmptyValueRows = (rows: ActivityAuditDiff[], parameters: string[]): ActivityAuditDiff[] => {
  let cursor = 0;
  return parameters.map((parameter) => {
    if (rows[cursor]?.parameter === parameter) return rows[cursor++];
    return { parameter, value: '' };
  });
};

export const getColumnBucketKey = (name: string): string => `${COLUMNS_BUCKET_PREFIX}${name}`;

export const isColumnBucketKey = (key: string): boolean => key.startsWith(COLUMNS_BUCKET_PREFIX);

export const getColumnNameFromBucketKey = (key: string): string => key.slice(COLUMNS_BUCKET_PREFIX.length);

const applyBucketStatus = (result: Record<string, ActivityAuditDiff[]>, status: DiffStatus): void => {
  Object.values(result).forEach((rows) => {
    rows.forEach((row) => {
      if (row.diffStatus == null) row.diffStatus = status;
    });
  });
};

/**
 * Build the diff buckets for one side of an analytics revision comparison:
 * `properties` from every field other than `columns`, plus one `columns:<name>`
 * bucket per column present in either revision.
 *
 * Unlike `compareMetadataEnvs`, this emits in both directions — a column present
 * on one side only still produces a bucket on both, so a removed column stays
 * visible with placeholder rows instead of disappearing.
 *
 * @param {ActivityAuditEntity | null} current - the opposite side of the comparison
 * @param {ActivityAuditEntity | null} compare - the side being rendered
 * @param {?boolean} [isCurrent] - true while building the older (Before) side
 * @returns {Record<string, ActivityAuditDiff[]>} - diff buckets
 */
export const buildAnalyticsDiff = (
  current: ActivityAuditEntity | null,
  compare: ActivityAuditEntity | null,
  isCurrent?: boolean,
): Record<string, ActivityAuditDiff[]> => {
  const result: Record<string, ActivityAuditDiff[]> = { properties: [] };
  if (!compare) return result;

  const hasBothSides = current != null;
  const currentParameters = Object.keys(getSnapshotLeaves(current));
  const compareParameters = Object.keys(getSnapshotLeaves(compare));
  const parameters = union(currentParameters, compareParameters).sort(sortKeys);

  if (hasBothSides) {
    compareNestedFlatObject(
      result.properties,
      snapshotRows(current, parameters),
      snapshotRows(compare, parameters),
      isCurrent,
    );
  } else {
    fillNestedFlatObject(result.properties, snapshotRows(compare, parameters));
  }
  result.properties = restoreEmptyValueRows(result.properties, parameters);

  const currentColumns = getColumnsByName(current);
  const compareColumns = getColumnsByName(compare);
  const names = union(Object.keys(currentColumns), Object.keys(compareColumns)).sort((a, b) => a.localeCompare(b));

  names.forEach((name) => {
    const bucket: ActivityAuditDiff[] = [];
    const extraParameters = getExtraColumnParameters(currentColumns[name], compareColumns[name]);
    if (hasBothSides) {
      compareNestedFlatObject(
        bucket,
        columnRows(currentColumns[name], extraParameters),
        columnRows(compareColumns[name], extraParameters),
        isCurrent,
      );
    } else {
      fillNestedFlatObject(bucket, columnRows(compareColumns[name], extraParameters));
    }
    if (bucket.length) result[getColumnBucketKey(name)] = bucket;
  });

  if (!hasBothSides && isCurrent !== undefined) {
    applyBucketStatus(result, isCurrent ? DiffStatus.REMOVED : DiffStatus.ADDED);
  }
  return result;
};

/**
 * Status of a column group, read off the rows of the newer side. The `name` row
 * is always emitted and is never empty for a column that exists, so its status
 * answers presence exactly: a group is `Added` / `Removed` only when the column
 * itself appeared or disappeared, not when one of its attributes did.
 *
 * @param {?ActivityAuditDiff[]} [rows] - rows of the newer side of the comparison
 * @returns {DiffStatus | undefined} - group status, or undefined when unchanged
 */
export const getColumnGroupStatus = (rows?: ActivityAuditDiff[]): DiffStatus | undefined => {
  if (!rows?.length) return undefined;
  const nameRow = rows.find((row) => row.parameter === COLUMN_NAME_PARAMETER);
  if (nameRow?.diffStatus === DiffStatus.ADDED) return DiffStatus.ADDED;
  if (nameRow?.diffStatus === DiffStatus.REMOVED) return DiffStatus.REMOVED;
  const hasChange = rows.some((row) => row.diffStatus != null && row.diffStatus !== DiffStatus.MIRROR);
  return hasChange ? DiffStatus.CHANGED : undefined;
};

export const hasAnalyticsColumnBuckets = (diffMap: Record<string, ActivityAuditDiff[]>): boolean =>
  Object.keys(diffMap).some(isColumnBucketKey);

/**
 * Drop the `columns:<name>` buckets from a diff map, so the generic section
 * walk cannot mistake a column called `metadata` or `defaults` for one of the
 * container / admin sections whose collector matches a key by substring.
 *
 * @param {Record<string, ActivityAuditDiff[]>} diffMap - diff buckets
 * @returns {Record<string, ActivityAuditDiff[]>} - buckets without column ones
 */
export const omitAnalyticsColumnBuckets = (
  diffMap: Record<string, ActivityAuditDiff[]>,
): Record<string, ActivityAuditDiff[]> =>
  Object.fromEntries(Object.entries(diffMap).filter(([key]) => !isColumnBucketKey(key)));

/**
 * Collect the `columns:<name>` buckets of both passes into the `columns`
 * section, one entry per column name, ordered by name.
 *
 * @param {ActivityAuditSection} sections - section map being built
 * @param {Record<string, ActivityAuditDiff[]>} current - before-pass buckets
 * @param {Record<string, ActivityAuditDiff[]>} compare - after-pass buckets
 */
export const setAnalyticsColumnDiffs = (
  sections: ActivityAuditSection,
  current: Record<string, ActivityAuditDiff[]>,
  compare: Record<string, ActivityAuditDiff[]>,
): void => {
  const names = union(
    Object.keys(current).filter(isColumnBucketKey).map(getColumnNameFromBucketKey),
    Object.keys(compare).filter(isColumnBucketKey).map(getColumnNameFromBucketKey),
  ).sort((a, b) => a.localeCompare(b));

  names.forEach((name) => {
    const key = getColumnBucketKey(name);
    const currentRows = current[key];
    const compareRows = compare[key];
    if (!currentRows?.length && !compareRows?.length) return;
    if (!sections[EntityParameterKeys.COLUMNS]) sections[EntityParameterKeys.COLUMNS] = [];
    const section: ActivityAuditDiffSection = {
      current: currentRows,
      compare: compareRows,
      label: name,
      diffStatus: getColumnGroupStatus(compareRows?.length ? compareRows : currentRows),
    };
    sections[EntityParameterKeys.COLUMNS].push(section);
  });
};

/**
 * Heading of a column group. The interpolation lives here because
 * `createSectionFromDiffs` has no translator, so the section carries the bare
 * column name and the renderer resolves it.
 *
 * @param {TranslateFn} t - translator
 * @param {?string} [label] - column name from the section entry
 * @returns {string | undefined} - localized heading, or undefined without a label
 */
export const getAnalyticsColumnHeading = (t: TranslateFn, label?: string): string | undefined =>
  label == null ? undefined : t(CompareI18nKey.ColumnGroup, { name: label });
