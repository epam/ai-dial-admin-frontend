'use client';

import { FC } from 'react';

import { DialLabelledText, Tooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';
import { Pipeline, PipelineKind } from '@/src/models/analytics/pipeline';

interface Props {
  pipeline: Pipeline;
  /** The resolved target's grain key, which leads the stored one so an unsaved target change shows here. */
  grainKey?: string;
}

/**
 * Everything the service derived, in one row above the form: what the declaration resolved to, and what
 * the runtime has done with it since.
 *
 * The three states worth acting on — a failed run, a pipeline held at its input's watermark, and an output
 * left behind by a rebuilt input — are not here: `PipelineRuntimeAlerts` raises them above the tab strip.
 *
 * The grain key is the one fact read from the draft's resolution rather than from the pipeline: it is the
 * only place the page states it since the group trigger stopped repeating it, and the grouping key has to
 * re-derive with a target the caller has changed but not yet saved. It stays read-only and unsent.
 *
 * A runtime value the service has not reported is left out rather than printed as an em dash. Those values
 * appear as the pipeline runs — a pipeline that has never run has none of them — so a row of placeholders
 * would state absence where there is simply nothing yet. The declaration's own facts keep their em dash:
 * there the blank means the declaration does not name one, which is worth reading.
 */
const PipelineReadOnlyFacts: FC<Props> = ({ pipeline, grainKey }) => {
  const t = useI18n();

  const state = pipeline.state;

  const createdAt = useLocalDateTimeString(pipeline.created_at);
  const updatedAt = useLocalDateTimeString(pipeline.updated_at);
  const lastRunAt = useLocalDateTimeString(state?.last_run_at);
  const nextRunAt = useLocalDateTimeString(state?.next_run_at);
  const drainedAt = useLocalDateTimeString(state?.drained_at);

  const notSet = t(AnalyticsPipelinesI18nKey.NotSet);

  const isEnrich = pipeline.kind === PipelineKind.Enrich;

  // Where the grain key comes from is read once and then known, so it hangs on the label rather than
  // printing a line under the value. The icon carries the sentence as its own name: a tooltip alone
  // reaches neither a screen reader nor a device without hover.
  const grainKeyHint = t(AnalyticsPipelinesI18nKey.GrainKeyHint);
  const grainKeyLabel = (
    <span className="flex items-center gap-1">
      {t(AnalyticsPipelinesI18nKey.GrainKey)}
      <Tooltip tooltip={grainKeyHint} asChild>
        <IconInfoCircle
          {...BASE_BUTTON_ICON_PROPS}
          role="img"
          aria-label={grainKeyHint}
          tabIndex={0}
          className="shrink-0 text-secondary"
        />
      </Tooltip>
    </span>
  );

  return (
    <section
      aria-label={t(AnalyticsPipelinesI18nKey.ReadOnlyFacts)}
      className="flex flex-col gap-3 border-b border-primary pb-8"
    >
      <div className="flex flex-row flex-wrap gap-8">
        {isEnrich && (
          <>
            <DialLabelledText label={grainKeyLabel} text={grainKey || pipeline.grain_key || notSet} />
            <LabelledText label={t(AnalyticsPipelinesI18nKey.VersionColumn)} text={pipeline.version_column || notSet} />
          </>
        )}
        <LabelledText label={t(AnalyticsPipelinesI18nKey.Generation)} text={String(pipeline.generation)} />
        <LabelledText label={t(AnalyticsPipelinesI18nKey.CreatedAt)} text={createdAt || notSet} />
        <LabelledText label={t(AnalyticsPipelinesI18nKey.Updated)} text={updatedAt || notSet} />

        {lastRunAt && <LabelledText label={t(AnalyticsPipelinesI18nKey.LastRun)} text={lastRunAt} />}
        {nextRunAt && <LabelledText label={t(AnalyticsPipelinesI18nKey.NextRun)} text={nextRunAt} />}
        {state?.lag_seconds != null && (
          <LabelledText
            label={t(AnalyticsPipelinesI18nKey.Lag)}
            text={t(AnalyticsPipelinesI18nKey.LagSeconds, { count: state.lag_seconds })}
          />
        )}
        {state?.has_more != null && (
          <LabelledText
            label={t(AnalyticsPipelinesI18nKey.Backlog)}
            text={t(state.has_more ? AnalyticsPipelinesI18nKey.BacklogYes : AnalyticsPipelinesI18nKey.BacklogNo)}
          />
        )}
        {drainedAt && <LabelledText label={t(AnalyticsPipelinesI18nKey.DrainedAt)} text={drainedAt} />}
      </div>
    </section>
  );
};

export default PipelineReadOnlyFacts;
