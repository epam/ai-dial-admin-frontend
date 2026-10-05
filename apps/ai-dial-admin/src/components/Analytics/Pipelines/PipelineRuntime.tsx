'use client';

import { FC, ReactNode } from 'react';

import {
  Button,
  ButtonAppearance,
  ButtonVariant,
  NoDataContent,
  Notification,
  NotificationType,
  NotificationVariant,
} from '@epam/ai-dial-ui-kit';
import { IconRefresh } from '@tabler/icons-react';

import PipelineFailuresCard from '@/src/components/Analytics/Pipelines/Failures/PipelineFailuresCard';
import { PipelineFailuresRead } from '@/src/components/Analytics/Pipelines/Failures/use-pipeline-failures';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';
import { Pipeline } from '@/src/models/analytics/pipeline';

interface Props {
  pipeline: Pipeline;
  /** The runner's dead letters for this pipeline, read by the frame so the tab label can carry them. */
  failures: PipelineFailuresRead;
  /** Whether this kind of pipeline dead-letters at all; only a model-calling enrichment does. */
  canDeadLetter: boolean;
  isPaused: boolean;
  /**
   * Reads both upstreams again — the pipeline through the page, and the runner through the frame's own
   * hooks. The frame owns it because only the frame holds them.
   */
  onReload: () => void;
  /** The pause control, which the frame owns: it holds the runner read and the confirmation. */
  actions?: ReactNode;
}

/**
 * Undoes `DialLabelledText`'s own 200px cap. That default suits a dense form; this tab gives each value
 * a quarter of the page, and a truncated cursor identity is one nobody can read or copy.
 */
const UNCAPPED = 'max-w-none';

/**
 * One group of runtime facts, as a card.
 *
 * Cards rather than rules between stacked groups: the failures card below these is a card, and two
 * presentation idioms on one tab read as two unrelated screens.
 *
 * Stacked, each the full width. Side by side they were forced to a shared height, so the schedule —
 * two values against the state's seven — sat above a card's worth of empty space; and the failures
 * card below was already full width, so the tab read as a two-column layout that gave up halfway.
 * Full width also lets a row hold four values instead of three, which is what absorbs the height the
 * stacking costs.
 *
 * The card is a raised layer and nothing else: no rim. Against the panel behind it the fill is already
 * the boundary, and a border on top of it draws the box twice.
 *
 * A group whose every member the service omitted renders nothing at all. A heading over an empty card
 * states that something is missing, where the truth is that this kind of pipeline has no such facts —
 * an on-ingest pipeline has no schedule, and a bare `SCHEDULE` above white space reads as a fault.
 */
const RuntimeSection: FC<{ title: string; children: ReactNode }> = ({ title, children }) => {
  const rendered = Array.isArray(children) ? children.flat() : [children];
  if (!rendered.some(Boolean)) return null;

  return (
    <section aria-label={title} className="flex flex-col gap-4 rounded bg-layer-3 p-4">
      <h3 className="dial-small-semi-text uppercase tracking-wide text-secondary">{title}</h3>
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>
    </section>
  );
};

/**
 * The runtime the two services report, in the groups an operator reads it by.
 *
 * Every value here is measured against the moment of the read — the lag most of all — so re-reading is
 * offered rather than the age of the answer being stated. The state arrives with the pipeline, so there
 * is one copy of it rather than a second, client-side one that could disagree with the server
 * component's; the failures come from the runner, which is a separate read the frame owns.
 *
 * The clamp and the required rebuild are **not** restated here. They are already raised as alerts above
 * the tab strip, in the same words, and a reader who has just read the alert does not need to meet it
 * again two sections down.
 *
 * A member the service omitted is left out. These appear as the pipeline runs, and a row of em dashes
 * would state absence where there is simply nothing yet.
 */
const PipelineRuntime: FC<Props> = ({ pipeline, failures, canDeadLetter, isPaused, onReload, actions }) => {
  const t = useI18n();

  const state = pipeline.state;

  const lastRunAt = useLocalDateTimeString(state?.last_run_at);
  const nextRunAt = useLocalDateTimeString(state?.next_run_at);
  const drainedAt = useLocalDateTimeString(state?.drained_at);

  // Which sections have anything to draw — and, when none of them do, the pipeline has done nothing yet.
  // Judging that by `last_run_at` alone was wrong: ADAS records it only for the kinds it drives on a
  // schedule, so an on-ingest pipeline the runner drives has none of it while working perfectly. They
  // read the raw members rather than the formatted strings: `useLocalDateTimeString` is empty until its
  // effect runs, so a pipeline whose only facts are timestamps flashed "has not run yet" on first paint.
  const hasSchedule = Boolean(state?.last_run_at || state?.next_run_at);
  const hasProgress = Boolean(
    state &&
    (state.lag_seconds != null ||
      state.has_more != null ||
      state.cursor_version != null ||
      state.cursor_identity ||
      state.materialized_through_version != null ||
      state.materialized_through_identity ||
      state.drained_at),
  );
  // The registry's own run-level failure, judged on the raw member for the same reason as the two above.
  const hasRunFailure = Boolean(state?.last_error);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-y-4">
      <div className="flex flex-row flex-wrap items-center justify-end gap-3">
        {/* Both upstreams, not a page reload: the state comes with the pipeline and the pause and the
            failures from the frame's own reads. Outlined, because it only re-reads — the control that
            changes something stands beside it in solid. */}
        <Button
          variant={ButtonVariant.Neutral}
          appearance={ButtonAppearance.Outlined}
          label={t(AnalyticsPipelinesI18nKey.RuntimeReadAgain)}
          iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
          onClick={onReload}
        />
        {actions}
      </div>

      {!state && (
        <Notification
          variant={NotificationVariant.Warning}
          type={NotificationType.SectionMessage}
          role="status"
          title={t(AnalyticsPipelinesI18nKey.RuntimeUnavailableTitle)}
          message={t(AnalyticsPipelinesI18nKey.RuntimeUnavailable)}
        />
      )}

      {/* The one case with nothing to lay out. A pipeline that reports a failure is never among them:
          it ran, and saying otherwise sends an operator looking for a pipeline that never started. */}
      {state && !hasSchedule && !hasProgress && !hasRunFailure && (
        <div className="flex flex-1 items-center justify-center">
          <NoDataContent title={t(AnalyticsPipelinesI18nKey.NeverRun)} />
        </div>
      )}

      {state && (
        <div className="flex flex-col gap-4">
          <RuntimeSection title={t(AnalyticsPipelinesI18nKey.SectionSchedule)}>
            {lastRunAt && (
              <LabelledText className={UNCAPPED} label={t(AnalyticsPipelinesI18nKey.LastRun)} text={lastRunAt} />
            )}
            {nextRunAt && (
              <LabelledText className={UNCAPPED} label={t(AnalyticsPipelinesI18nKey.NextRun)} text={nextRunAt} />
            )}
          </RuntimeSection>

          <RuntimeSection title={t(AnalyticsPipelinesI18nKey.SectionState)}>
            {state.lag_seconds != null && (
              <LabelledText
                className={UNCAPPED}
                label={t(AnalyticsPipelinesI18nKey.Lag)}
                text={t(AnalyticsPipelinesI18nKey.LagSeconds, { count: state.lag_seconds })}
              />
            )}
            {state.has_more != null && (
              <LabelledText
                className={UNCAPPED}
                label={t(AnalyticsPipelinesI18nKey.Backlog)}
                text={t(state.has_more ? AnalyticsPipelinesI18nKey.BacklogYes : AnalyticsPipelinesI18nKey.BacklogNo)}
              />
            )}
            {state.cursor_version != null && (
              <LabelledText
                className={UNCAPPED}
                label={t(AnalyticsPipelinesI18nKey.CursorVersion)}
                text={String(state.cursor_version)}
              />
            )}
            {state.cursor_identity && (
              <LabelledText
                className={UNCAPPED}
                label={t(AnalyticsPipelinesI18nKey.CursorIdentity)}
                text={state.cursor_identity}
              />
            )}
            {state.materialized_through_version != null && (
              <LabelledText
                className={UNCAPPED}
                label={t(AnalyticsPipelinesI18nKey.MaterializedThroughVersion)}
                text={String(state.materialized_through_version)}
              />
            )}
            {state.materialized_through_identity && (
              <LabelledText
                className={UNCAPPED}
                label={t(AnalyticsPipelinesI18nKey.MaterializedThroughIdentity)}
                text={state.materialized_through_identity}
              />
            )}
            {/* Under state rather than under schedule, and with the caveat attached: it advances only on
                an empty probe, so on a busy pipeline it is old while everything is working. */}
            {drainedAt && (
              <LabelledText
                className={UNCAPPED}
                label={t(AnalyticsPipelinesI18nKey.DrainedAt)}
                text={drainedAt}
                tooltip={t(AnalyticsPipelinesI18nKey.DrainedAtHint)}
              />
            )}
          </RuntimeSection>

          {/* The run's own failure, which the registry records for the kinds it drives itself. Its own
              group rather than a line in the failures card: that card lists the dead letters of a
              model-calling enrichment, and this is the opposite kind of fact — one verdict on a whole
              run. The alert above the tab strip carries the message; what this adds is when. */}
          <RuntimeSection title={t(AnalyticsPipelinesI18nKey.SectionFailures)}>
            {hasRunFailure && (
              <LabelledText
                className={UNCAPPED}
                label={t(AnalyticsPipelinesI18nKey.LastError)}
                text={lastRunAt || t(AnalyticsPipelinesI18nKey.NotSet)}
              />
            )}
          </RuntimeSection>
        </div>
      )}

      {/* The dead letters of a model-calling enrichment. Governed by the runner rather than by `state`,
          so it is presented independently of the three content states above: a pipeline whose state was
          reset can still hold failures from before. */}
      {canDeadLetter && <PipelineFailuresCard pipeline={pipeline} failures={failures} isPaused={isPaused} />}
    </div>
  );
};

export default PipelineRuntime;
