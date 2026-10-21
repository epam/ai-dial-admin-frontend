import { FC } from 'react';

import BackfillRow from '@/src/components/Analytics/Common/BackfillSidebar/BackfillRow';
import { BackfillMetric } from '@/src/components/Analytics/Common/BackfillSidebar/models';
import CopyableText from '@/src/components/Common/CopyableText/CopyableText';
import { BackfillI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

interface Props {
  runId: string;
  windowText: string;
  /**
   * Rows of figures, each across one line and coloured: days, then rows, for an ingest; rows and dead letters for a
   * pipeline.
   */
  outcome: BackfillMetric[][];
  metrics?: BackfillMetric[];
  startedAt: string;
  finishedAt?: string | null;
}

/**
 * A run's facts in one layout for both kinds of run: id, window, the outcome in rows of figures, other measures,
 * then start and finish. The order and the names are fixed here so the two drawers cannot drift apart.
 */
const BackfillRunFacts: FC<Props> = ({ runId, windowText, outcome, metrics = [], startedAt, finishedAt }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col gap-y-3">
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3">
        <BackfillRow label={t(BackfillI18nKey.RunId)} isWide>
          <CopyableText value={runId} copyLabel={t(BackfillI18nKey.RunId)} />
        </BackfillRow>
        <BackfillRow label={t(BackfillI18nKey.Window)} isWide>
          {windowText}
        </BackfillRow>
      </dl>
      {outcome.map((group) => (
        <dl key={group.map((metric) => metric.label).join('|')} className="m-0 grid auto-cols-fr grid-flow-col gap-x-4">
          {group.map((metric) => (
            <BackfillRow key={metric.label} label={metric.label} hint={metric.hint} tone={metric.tone}>
              {metric.value}
            </BackfillRow>
          ))}
        </dl>
      ))}
      {metrics.length > 0 && (
        <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3">
          {metrics.map((metric) => (
            <BackfillRow key={metric.label} label={metric.label} hint={metric.hint} tone={metric.tone}>
              {metric.value}
            </BackfillRow>
          ))}
        </dl>
      )}
      {/* Its own row, so Started is not left alone beside the last measure. */}
      <dl className="m-0 grid auto-cols-fr grid-flow-col gap-x-4">
        <BackfillRow label={t(BackfillI18nKey.StartedAt)}>{formatDateTimeToLocalString(startedAt)}</BackfillRow>
        {finishedAt && (
          <BackfillRow label={t(BackfillI18nKey.FinishedAt)}>{formatDateTimeToLocalString(finishedAt)}</BackfillRow>
        )}
      </dl>
    </div>
  );
};

export default BackfillRunFacts;
