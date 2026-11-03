import {
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

/**
 * Reads the reason, logs and error a metric group's `metricInfos` entry holds for one leaf. The eval service
 * writes a failure's `error` on the leaf (`metricInfos[group][leaf].error`) or, for a failure that is not tied to
 * a leaf, beside the leaf entries (`metricInfos[group].error`); the leaf's own message wins. Returns `undefined`
 * when it holds none of the three, so a field with nothing to show carries no info at all.
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
  };

  return info.reason == null && info.logs == null && info.error == null ? undefined : info;
};
