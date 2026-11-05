import { IngestFailuresI18nKey } from '@/src/constants/i18n';
import { IngestFailureKind, IngestFailurePath, IngestFailureReason } from '@/src/models/analytics/ingest-failure';

export const INGEST_FAILURES_LIMIT = 1000;

export const INGEST_KIND_LABEL: Record<IngestFailureKind, IngestFailuresI18nKey> = {
  [IngestFailureKind.Blob]: IngestFailuresI18nKey.KindBlob,
  [IngestFailureKind.Day]: IngestFailuresI18nKey.KindDay,
  [IngestFailureKind.Records]: IngestFailuresI18nKey.KindRecords,
};

export const INGEST_PATH_LABEL: Record<IngestFailurePath, IngestFailuresI18nKey> = {
  [IngestFailurePath.Poll]: IngestFailuresI18nKey.PathPoll,
  [IngestFailurePath.Reconcile]: IngestFailuresI18nKey.PathReconcile,
  [IngestFailurePath.Backfill]: IngestFailuresI18nKey.PathBackfill,
  [IngestFailurePath.Retry]: IngestFailuresI18nKey.PathRetry,
};

export const INGEST_REASON_LABEL: Record<IngestFailureReason, IngestFailuresI18nKey> = {
  [IngestFailureReason.CorruptGzip]: IngestFailuresI18nKey.ReasonCorruptGzip,
  [IngestFailureReason.MappingError]: IngestFailuresI18nKey.ReasonMappingError,
  [IngestFailureReason.BlobMissing]: IngestFailuresI18nKey.ReasonBlobMissing,
  [IngestFailureReason.RejectedByServer]: IngestFailuresI18nKey.ReasonRejectedByServer,
  [IngestFailureReason.SkippedRecords]: IngestFailuresI18nKey.ReasonSkippedRecords,
  [IngestFailureReason.ReadError]: IngestFailuresI18nKey.ReasonReadError,
  [IngestFailureReason.ListingFailed]: IngestFailuresI18nKey.ReasonListingFailed,
  [IngestFailureReason.PrepareFailed]: IngestFailuresI18nKey.ReasonPrepareFailed,
  [IngestFailureReason.WriteFailed]: IngestFailuresI18nKey.ReasonWriteFailed,
  [IngestFailureReason.StorageFull]: IngestFailuresI18nKey.ReasonStorageFull,
};

export const INGEST_REASON_DESCRIPTION: Record<IngestFailureReason, IngestFailuresI18nKey> = {
  [IngestFailureReason.CorruptGzip]: IngestFailuresI18nKey.ReasonCorruptGzipDescription,
  [IngestFailureReason.MappingError]: IngestFailuresI18nKey.ReasonMappingErrorDescription,
  [IngestFailureReason.BlobMissing]: IngestFailuresI18nKey.ReasonBlobMissingDescription,
  [IngestFailureReason.RejectedByServer]: IngestFailuresI18nKey.ReasonRejectedByServerDescription,
  [IngestFailureReason.SkippedRecords]: IngestFailuresI18nKey.ReasonSkippedRecordsDescription,
  [IngestFailureReason.ReadError]: IngestFailuresI18nKey.ReasonReadErrorDescription,
  [IngestFailureReason.ListingFailed]: IngestFailuresI18nKey.ReasonListingFailedDescription,
  [IngestFailureReason.PrepareFailed]: IngestFailuresI18nKey.ReasonPrepareFailedDescription,
  [IngestFailureReason.WriteFailed]: IngestFailuresI18nKey.ReasonWriteFailedDescription,
  [IngestFailureReason.StorageFull]: IngestFailuresI18nKey.ReasonStorageFullDescription,
};
