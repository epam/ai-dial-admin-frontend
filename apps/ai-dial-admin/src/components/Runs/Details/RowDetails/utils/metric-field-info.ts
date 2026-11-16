import {
  METRIC_INFO_CARD_KEYS,
  METRIC_INFO_ERROR_KEY,
  METRIC_INFO_LOGS_KEY,
  METRIC_INFO_REASON_KEY,
} from '@/src/components/Runs/Details/RowDetails/constants';
import { MetricFieldInfo } from '@/src/components/Runs/Details/RowDetails/models';
import { serializeValue } from '@/src/utils/serialize';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === 'object' && !Array.isArray(value);

const toText = (value: unknown): string | null => {
  const text = serializeValue(value);
  return text?.trim() ? text : null;
};

// Falsy values stay: `tp: 0` and `false_positives: []` are the answer, not an absence. A leaf named like a card key
// (a failed metric reports `error`) finds the group's own entry under that name, not an entry of its own.
const getDetails = (entry: unknown, fieldKey: string): string | null => {
  if (METRIC_INFO_CARD_KEYS.has(fieldKey)) return null;
  if (!isRecord(entry)) return toText(entry);

  const own = Object.fromEntries(Object.entries(entry).filter(([key]) => !METRIC_INFO_CARD_KEYS.has(key)));
  return Object.keys(own).length > 0 ? toText(own) : null;
};

/**
 * Reads the reason, logs, error and details a metric group's `metricInfos` entry holds for one leaf. The eval
 * service writes a failure's `error` on the leaf (`metricInfos[group][leaf].error`) or, for a failure that is not
 * tied to a leaf, beside the leaf entries (`metricInfos[group].error`); the leaf's own message wins. Returns
 * `undefined` when it holds none of the four, so a field with nothing to show carries no info at all.
 */
export const getMetricFieldInfo = (
  infoGroup: Record<string, unknown> | undefined,
  fieldKey: string,
): MetricFieldInfo | undefined => {
  if (!infoGroup) return undefined;

  const entry = infoGroup[fieldKey];
  const leafInfo = isRecord(entry) ? entry : undefined;

  const info: MetricFieldInfo = {
    reason: toText(leafInfo?.[METRIC_INFO_REASON_KEY]),
    logs: toText(leafInfo?.[METRIC_INFO_LOGS_KEY]),
    error: toText(leafInfo?.[METRIC_INFO_ERROR_KEY]) ?? toText(infoGroup[METRIC_INFO_ERROR_KEY]),
    details: getDetails(entry, fieldKey),
  };

  return Object.values(info).every((value) => value == null) ? undefined : info;
};
