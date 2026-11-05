import { describe, expect, test } from 'vitest';

import { RetryOutcomeNote } from '@/src/components/Analytics/Tables/IngestFailures/models';
import { ingestFailure } from '@/src/components/Analytics/Tables/IngestFailures/tests/mock';
import {
  groupIngestFailures,
  isDeterministicReason,
  kindLabelKey,
  newestFailureAt,
  reasonLabelKey,
  retryOutcomeNote,
  selectionKey,
  subjectName,
  toRetryTarget,
} from '@/src/components/Analytics/Tables/IngestFailures/utils';
import { IngestFailuresI18nKey } from '@/src/constants/i18n';
import { IngestFailureClass, IngestFailureKind, IngestFailureReason } from '@/src/models/analytics/ingest-failure';

describe('groupIngestFailures', () => {
  test('groups by reason and kind, newest group first and newest failure first', () => {
    const older = ingestFailure({ subject: 'a', last_failed_at: '2026-11-04T01:00:00Z' });
    const newer = ingestFailure({ subject: 'b', last_failed_at: '2026-11-04T03:00:00Z' });
    const day = ingestFailure({
      kind: IngestFailureKind.Day,
      subject: '2026-11-03',
      reason: IngestFailureReason.ListingFailed,
      last_failed_at: '2026-11-04T02:00:00Z',
    });

    const groups = groupIngestFailures([older, day, newer]);

    expect(groups.map((group) => group.key)).toEqual(['mapping_error:blob', 'listing_failed:day']);
    expect(groups[0].failures.map((failure) => failure.subject)).toEqual(['b', 'a']);
    expect(groups[0].newestAt).toBe('2026-11-04T03:00:00Z');
  });

  test('puts one reason on two kinds into two groups', () => {
    const groups = groupIngestFailures([
      ingestFailure({ reason: IngestFailureReason.RejectedByServer }),
      ingestFailure({ reason: IngestFailureReason.RejectedByServer, kind: IngestFailureKind.Records }),
    ]);

    expect(groups).toHaveLength(2);
  });

  test('returns no group for no failure', () => {
    expect(groupIngestFailures([])).toEqual([]);
  });
});

describe('isDeterministicReason', () => {
  test('follows the failure class when the service sent one', () => {
    expect(isDeterministicReason(IngestFailureReason.ReadError, IngestFailureClass.Deterministic)).toBe(true);
    expect(isDeterministicReason(IngestFailureReason.MappingError, IngestFailureClass.Transient)).toBe(false);
  });

  test('falls back to the reason', () => {
    expect(isDeterministicReason(IngestFailureReason.CorruptGzip)).toBe(true);
    expect(isDeterministicReason(IngestFailureReason.WriteFailed)).toBe(false);
    expect(isDeterministicReason('something_new')).toBe(false);
  });
});

describe('selection helpers', () => {
  test('keys a target by kind and subject, so a blob and its records differ', () => {
    const blob = ingestFailure();
    const records = ingestFailure({ kind: IngestFailureKind.Records });

    expect(selectionKey(toRetryTarget(blob))).not.toBe(selectionKey(toRetryTarget(records)));
    expect(toRetryTarget(records)).toEqual({ kind: IngestFailureKind.Records, subject: records.subject });
  });

  test('names a blob by its file name and a day by itself', () => {
    expect(subjectName(ingestFailure())).toBe('a.log.gz');
    expect(subjectName(ingestFailure({ subject: '2026-11-03' }))).toBe('2026-11-03');
  });

  test('finds the newest failure or none', () => {
    expect(newestFailureAt([ingestFailure(), ingestFailure({ last_failed_at: '2026-11-05T00:00:00Z' })])).toBe(
      '2026-11-05T00:00:00Z',
    );
    expect(newestFailureAt([])).toBeUndefined();
  });

  test('knows a known reason label and not an unknown one', () => {
    expect(reasonLabelKey(IngestFailureReason.CorruptGzip)).toBe(IngestFailuresI18nKey.ReasonCorruptGzip);
    expect(reasonLabelKey('something_new')).toBeUndefined();
  });

  test('knows a known kind label and not an unknown one', () => {
    expect(kindLabelKey(IngestFailureKind.Records)).toBe(IngestFailuresI18nKey.KindRecords);
    expect(kindLabelKey('partition')).toBeUndefined();
  });
});

describe('retryOutcomeNote', () => {
  const sweep = { enabled: true, next_sweep_at: '2026-11-05T10:15:00Z', max_per_sweep: 10 };

  test('states the next pass', () => {
    expect(retryOutcomeNote(3, sweep)).toBe(RetryOutcomeNote.NextPass);
  });

  test('states several passes beyond one pass', () => {
    expect(retryOutcomeNote(11, sweep)).toBe(RetryOutcomeNote.SeveralPasses);
  });

  test('states several passes without a time when the answer names no next pass', () => {
    expect(retryOutcomeNote(11, { enabled: true, max_per_sweep: 10 })).toBe(RetryOutcomeNote.SeveralPassesUntimed);
  });

  test('states a switched-off pass first', () => {
    expect(retryOutcomeNote(11, { enabled: false, max_per_sweep: 10 })).toBe(RetryOutcomeNote.SweepOff);
  });

  test('states nothing without a sweep or a next time', () => {
    expect(retryOutcomeNote(1)).toBeUndefined();
    expect(retryOutcomeNote(1, { enabled: true, max_per_sweep: 10 })).toBeUndefined();
  });
});
