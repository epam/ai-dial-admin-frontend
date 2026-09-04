import {
  ColumnExtractionStatus,
  EvaluatedColumn,
  NotExtractedReason,
  TryOutInvocation,
} from '@/src/components/TestSuites/utils/models';
import { ExtractionWarning, ResponseColumn, StreamingStatus } from '@/src/models/evaluation/test-suite';

/**
 * A reported value rendered for display. The only failure signal is an explicit `null` in the
 * extraction, so `false`, `0` and `''` render as themselves rather than reading as "nothing extracted".
 */
export const formatExtractedValue = (value: unknown): string =>
  typeof value === 'string' ? value : (JSON.stringify(value) ?? '');

const isSuccessStatus = (statusCode?: number): boolean => statusCode == null || (statusCode >= 200 && statusCode < 300);

/**
 * Why the invocation reported no extraction. Read from what the response says rather than re-deriving
 * the backend's own condition: a stream can terminate abnormally while still carrying a 200.
 */
const notExtractedReason = (invocation: TryOutInvocation): NotExtractedReason => {
  const { statusCode, streamingStatus } = invocation.response ?? {};

  if (streamingStatus && streamingStatus !== StreamingStatus.Success) {
    return NotExtractedReason.StreamIncomplete;
  }
  if (!isSuccessStatus(statusCode)) {
    return NotExtractedReason.RequestFailed;
  }

  return NotExtractedReason.NoExtractionReported;
};

const notExtractedColumn = (
  column: ResponseColumn,
  reason: NotExtractedReason,
  statusCode?: number,
): EvaluatedColumn => ({
  name: column.name,
  expression: column.expression,
  type: column.type,
  status: ColumnExtractionStatus.NotExtracted,
  result: '',
  reason,
  ...(reason === NotExtractedReason.RequestFailed && statusCode != null ? { statusCode } : {}),
});

const warningFor = (warnings: ExtractionWarning[] | undefined, name: string): ExtractionWarning | undefined =>
  warnings?.find((warning) => warning.column === name);

/**
 * One invocation's column results, taken from the extraction it reported.
 *
 * The frontend classifies rather than re-derives: it never decides whether extraction should have
 * happened, only reports what the response says about it. A column present with a value is
 * `Extracted`; present as an explicit `null` is `Failed`, carrying the warning's error and the
 * expression the backend actually evaluated; declared but absent from the mapping is `NotExtracted`.
 */
export const resolveInvocationColumns = (
  columns: ResponseColumn[],
  invocation: TryOutInvocation,
): EvaluatedColumn[] => {
  if (!columns.length) {
    return [];
  }

  const { extractedColumns, extractionWarnings } = invocation;

  if (!extractedColumns) {
    const reason = notExtractedReason(invocation);
    return columns.map((column) => notExtractedColumn(column, reason, invocation.response?.statusCode));
  }

  return columns.map((column) => {
    if (!Object.prototype.hasOwnProperty.call(extractedColumns, column.name)) {
      return notExtractedColumn(column, NotExtractedReason.NoExtractionReported);
    }

    const value = extractedColumns[column.name];
    const warning = warningFor(extractionWarnings, column.name);

    if (value === null) {
      return {
        name: column.name,
        expression: warning?.expression || column.expression,
        type: column.type,
        status: ColumnExtractionStatus.Failed,
        result: '',
        ...(warning?.error ? { error: warning.error } : {}),
      };
    }

    return {
      name: column.name,
      expression: warning?.expression || column.expression,
      type: column.type,
      status: ColumnExtractionStatus.Extracted,
      result: formatExtractedValue(value),
    };
  });
};
