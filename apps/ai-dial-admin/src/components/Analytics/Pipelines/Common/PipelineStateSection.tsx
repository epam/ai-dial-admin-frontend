'use client';

import { FC } from 'react';

import PipelineSection from '@/src/components/Analytics/Pipelines/Common/PipelineSection';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';
import { PipelineState } from '@/src/models/analytics/pipeline';

interface Props {
  state?: PipelineState;
}

const PipelineStateSection: FC<Props> = ({ state }) => {
  const t = useI18n();

  const lastRunAt = useLocalDateTimeString(state?.last_run_at);
  const nextRunAt = useLocalDateTimeString(state?.next_run_at);
  const drainedAt = useLocalDateTimeString(state?.drained_at);

  const notSet = t(AnalyticsPipelinesI18nKey.NotSet);

  if (!state) {
    return null;
  }

  const clamp = state.clamp;
  const rebuild = state.rebuild_required;
  const unclamped = state.unclamped_reads ?? [];

  return (
    <PipelineSection title={t(AnalyticsPipelinesI18nKey.SectionRuntimeState)}>
      <div className="flex flex-row flex-wrap gap-8">
        <LabelledText label={t(AnalyticsPipelinesI18nKey.LastRun)} text={lastRunAt || notSet} />
        <LabelledText label={t(AnalyticsPipelinesI18nKey.NextRun)} text={nextRunAt || notSet} />
        <LabelledText
          label={t(AnalyticsPipelinesI18nKey.Lag)}
          text={
            state.lag_seconds == null ? notSet : t(AnalyticsPipelinesI18nKey.LagSeconds, { count: state.lag_seconds })
          }
        />
        <LabelledText
          label={t(AnalyticsPipelinesI18nKey.Backlog)}
          text={
            state.has_more == null
              ? notSet
              : t(state.has_more ? AnalyticsPipelinesI18nKey.BacklogYes : AnalyticsPipelinesI18nKey.BacklogNo)
          }
        />
        {drainedAt && <LabelledText label={t(AnalyticsPipelinesI18nKey.DrainedAt)} text={drainedAt} />}
      </div>

      {state.last_error && (
        <p role="status" className="text-error dial-tiny-text">
          {state.last_error}
        </p>
      )}

      {clamp && (
        <p className="text-secondary dial-tiny-text">
          {t(AnalyticsPipelinesI18nKey.ClampedBy, { enrichment: clamp.enrichment })}
        </p>
      )}

      {rebuild && (
        <p role="status" className="text-warning dial-tiny-text">
          {t(AnalyticsPipelinesI18nKey.RebuildRequired, { enrichment: rebuild.enrichment })}
        </p>
      )}

      {unclamped.length > 0 && (
        <ul className="flex flex-col gap-1 text-secondary dial-tiny-text">
          {unclamped.map((read) => (
            <li key={read.enrichment}>
              {t(AnalyticsPipelinesI18nKey.UnclampedRead, { enrichment: read.enrichment, reason: read.reason })}
            </li>
          ))}
        </ul>
      )}
    </PipelineSection>
  );
};

export default PipelineStateSection;
