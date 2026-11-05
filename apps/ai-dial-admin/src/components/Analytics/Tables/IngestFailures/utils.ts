import {
  INGEST_KIND_LABEL,
  INGEST_REASON_DESCRIPTION,
  INGEST_REASON_LABEL,
} from '@/src/components/Analytics/Tables/IngestFailures/constants';
import { IngestFailureGroup, RetryOutcomeNote } from '@/src/components/Analytics/Tables/IngestFailures/models';
import { IngestFailuresI18nKey } from '@/src/constants/i18n';
import {
  IngestFailure,
  IngestFailureClass,
  IngestFailureKind,
  IngestFailureReason,
  IngestFailureTarget,
  IngestRetrySweep,
} from '@/src/models/analytics/ingest-failure';

const DETERMINISTIC_REASONS = new Set<string>([
  IngestFailureReason.CorruptGzip,
  IngestFailureReason.MappingError,
  IngestFailureReason.BlobMissing,
  IngestFailureReason.RejectedByServer,
  IngestFailureReason.SkippedRecords,
]);

export const isDeterministicReason = (reason: string, failureClass?: IngestFailureClass): boolean =>
  failureClass ? failureClass === IngestFailureClass.Deterministic : DETERMINISTIC_REASONS.has(reason);

const byNewest = (a: IngestFailure, b: IngestFailure): number => b.last_failed_at.localeCompare(a.last_failed_at);

export const groupIngestFailures = (failures: IngestFailure[]): IngestFailureGroup[] => {
  const groups = new Map<string, IngestFailureGroup>();

  for (const failure of failures) {
    const key = `${failure.reason}:${failure.kind}`;
    const group = groups.get(key);

    if (group) {
      group.failures.push(failure);
      if (failure.last_failed_at > group.newestAt) group.newestAt = failure.last_failed_at;
    } else {
      groups.set(key, {
        key,
        reason: failure.reason,
        kind: failure.kind,
        failures: [failure],
        newestAt: failure.last_failed_at,
      });
    }
  }

  return [...groups.values()]
    .map((group) => ({ ...group, failures: [...group.failures].sort(byNewest) }))
    .sort((a, b) => b.newestAt.localeCompare(a.newestAt));
};

export const toRetryTarget = ({ kind, subject }: IngestFailure): IngestFailureTarget => ({ kind, subject });

export const selectionKey = ({ kind, subject }: IngestFailureTarget): string => `${kind}:${subject}`;

export const failureKey = (failure: IngestFailure): string => selectionKey(toRetryTarget(failure));

export const subjectName = ({ subject }: IngestFailure): string =>
  subject.slice(subject.lastIndexOf('/') + 1) || subject;

export const newestFailureAt = (failures: IngestFailure[]): string | undefined =>
  failures.reduce<string | undefined>(
    (newest, failure) => (!newest || failure.last_failed_at > newest ? failure.last_failed_at : newest),
    undefined,
  );

export const retryOutcomeNote = (requeued: number, sweep?: IngestRetrySweep): RetryOutcomeNote | undefined => {
  if (!sweep) return undefined;
  if (!sweep.enabled) return RetryOutcomeNote.SweepOff;
  if (sweep.max_per_sweep > 0 && requeued > sweep.max_per_sweep) {
    return sweep.next_sweep_at ? RetryOutcomeNote.SeveralPasses : RetryOutcomeNote.SeveralPassesUntimed;
  }

  return sweep.next_sweep_at ? RetryOutcomeNote.NextPass : undefined;
};

const isKnownReason = (reason: string): reason is IngestFailureReason =>
  (Object.values(IngestFailureReason) as string[]).includes(reason);

export const reasonLabelKey = (reason: string): IngestFailuresI18nKey | undefined =>
  isKnownReason(reason) ? INGEST_REASON_LABEL[reason] : undefined;

export const reasonDescriptionKey = (reason: string): IngestFailuresI18nKey | undefined =>
  isKnownReason(reason) ? INGEST_REASON_DESCRIPTION[reason] : undefined;

const isKnownKind = (kind: string): kind is IngestFailureKind =>
  (Object.values(IngestFailureKind) as string[]).includes(kind);

export const kindLabelKey = (kind: string): IngestFailuresI18nKey | undefined =>
  isKnownKind(kind) ? INGEST_KIND_LABEL[kind] : undefined;
