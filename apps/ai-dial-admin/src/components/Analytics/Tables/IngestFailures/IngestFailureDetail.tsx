'use client';

import { FC } from 'react';

import FailureDetailMessage from '@/src/components/Analytics/Common/Failures/FailureDetailMessage';
import { INGEST_PATH_LABEL } from '@/src/components/Analytics/Tables/IngestFailures/constants';
import {
  kindLabelKey,
  reasonDescriptionKey,
  reasonLabelKey,
} from '@/src/components/Analytics/Tables/IngestFailures/utils';
import CopyableText from '@/src/components/Common/CopyableText/CopyableText';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { IngestFailuresI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { IngestFailure, IngestFailurePath, IngestFailureState } from '@/src/models/analytics/ingest-failure';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

const VALUE_TEXT = 'dial-small-text text-primary';

interface Props {
  failure: IngestFailure;
}

const isKnownPath = (path?: string): path is IngestFailurePath =>
  path != null && (Object.values(IngestFailurePath) as string[]).includes(path);

const IngestFailureDetail: FC<Props> = ({ failure }) => {
  const t = useI18n();

  const labelKey = reasonLabelKey(failure.reason);
  const descriptionKey = reasonDescriptionKey(failure.reason);
  const reasonText = descriptionKey
    ? t(IngestFailuresI18nKey.ReasonValue, {
        reason: labelKey ? t(labelKey) : failure.reason,
        description: t(descriptionKey),
      })
    : failure.reason;
  const kindKey = kindLabelKey(failure.kind);
  const kindText = kindKey ? t(kindKey) : failure.kind;
  const pathText = isKnownPath(failure.path) ? t(INGEST_PATH_LABEL[failure.path]) : failure.path;
  const isPending = failure.state === IngestFailureState.Pending;

  return (
    <div className="flex flex-col gap-4 bg-layer-2 p-4">
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
        <LabelledText label={t(IngestFailuresI18nKey.Key)}>
          <CopyableText
            value={failure.subject}
            copyLabel={t(IngestFailuresI18nKey.Key)}
            textClassName={`${VALUE_TEXT} [overflow-wrap:anywhere]`}
          />
        </LabelledText>
        <LabelledText label={t(IngestFailuresI18nKey.Kind)} text={kindText} />
        <LabelledText label={t(IngestFailuresI18nKey.Reason)} text={reasonText} />
        <LabelledText
          label={t(IngestFailuresI18nKey.AutoRetry)}
          text={t(isPending ? IngestFailuresI18nKey.Yes : IngestFailuresI18nKey.No)}
        />
        {pathText && <LabelledText label={t(IngestFailuresI18nKey.Path)} text={pathText} />}
        <LabelledText label={t(IngestFailuresI18nKey.Attempts)} text={String(failure.attempts)} />
        <LabelledText
          label={t(IngestFailuresI18nKey.FirstFailed)}
          text={formatDateTimeToLocalString(failure.first_failed_at)}
        />
        <LabelledText
          label={t(IngestFailuresI18nKey.LastFailed)}
          text={formatDateTimeToLocalString(failure.last_failed_at)}
        />
        {failure.blob_last_modified && (
          <LabelledText
            label={t(IngestFailuresI18nKey.BlobModified)}
            text={formatDateTimeToLocalString(failure.blob_last_modified)}
          />
        )}
        {isPending && failure.next_attempt_at && (
          <LabelledText
            label={t(IngestFailuresI18nKey.NextAttempt)}
            text={formatDateTimeToLocalString(failure.next_attempt_at)}
          />
        )}
        {!!failure.backfill_run_ids?.length && (
          <LabelledText label={t(IngestFailuresI18nKey.BackfillRuns)} text={failure.backfill_run_ids.join(', ')} />
        )}
      </div>

      <FailureDetailMessage
        label={t(IngestFailuresI18nKey.Message)}
        lines={failure.message ? [failure.message] : []}
        copyValue={failure.message ?? ''}
        noMessageLabel={t(IngestFailuresI18nKey.NoMessage)}
      />
    </div>
  );
};

export default IngestFailureDetail;
