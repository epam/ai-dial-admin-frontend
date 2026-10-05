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
import { PipelineRuntimeViewRead } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-runtime-view';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';
import { Pipeline } from '@/src/models/analytics/pipeline';
import { RuntimeReadOutcome } from '@/src/models/analytics/pipeline-runtime';

interface Props {
  pipeline: Pipeline;
  /** What the runner says about this pipeline, and which of its answers produced it. */
  runtime: PipelineRuntimeViewRead;
  /** The runner is executing an older declaration than the one on screen. */
  isGenerationBehind: boolean;
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
 * One timestamp, local to the reader, or nothing at all.
 *
 * A component rather than a call per value: the tab states a dozen timestamps across two services, and
 * `useLocalDateTimeString` is a hook, so each one would otherwise be a hook call in the body whether or
 * not the service sent the member.
 *
 * `fallback` serves the one row that renders even without a timestamp, because an alert above the tab
 * refers to it. Both the absence test and the fallback read the **raw** member rather than the
 * formatted string: the string is empty until the hook's effect runs, so a gate read from it paints
 * "not recorded" on the first render and flips to the real date a tick later.
 *
 * Callers still guard on the raw member **outside** this element rather than relying on the null it
 * returns. `RuntimeSection` decides whether to draw its heading from its children array, and an element
 * that renders nothing is still an entry in that array — so a card of absent dates would keep its
 * heading over empty space, which is the thing that rule exists to prevent.
 */
const LabelledDate: FC<{ label: string; at?: string; tooltip?: string; fallback?: string }> = ({
  label,
  at,
  tooltip,
  fallback,
}) => {
  const text = useLocalDateTimeString(at);

  if (!at && !fallback) return null;

  return <LabelledText className={UNCAPPED} label={label} text={at ? text : fallback} tooltip={tooltip} />;
};

/**
 * One count, or nothing. A count the runner has not recorded is absent, and absence is not zero.
 *
 * A function rather than a component, and called rather than rendered: `RuntimeSection` decides whether
 * to draw its heading from its children array, and a component that renders nothing is still an entry
 * in that array — so a card of absent counts would keep its heading over empty space. Written as a
 * function it contributes a literal `null`, which that test sees. It holds no state and calls no hook,
 * so nothing is lost by not being a component.
 */
const labelledCount = (label: string, count?: number): ReactNode =>
  count == null ? null : <LabelledText key={label} className={UNCAPPED} label={label} text={count.toLocaleString()} />;

/**
 * The runtime the two services report, in the groups an operator reads it by.
 *
 * **Which service answers what.** The runner owns the execution of an `enrich` pipeline and serves a
 * per-pipeline view of it; the registry owns an `aggregate` pipeline's execution and records almost
 * nothing for an enrichment. Where both describe one fact — the lag, the backlog, the next fire — the
 * runner's answer wins and the registry's is not drawn beside it, because two rows stating one
 * pipeline's schedule from two services sampled moments apart invite a reader to treat the difference
 * as a fact about the pipeline. Where only one of them has an answer, that answer is drawn whichever
 * service it came from: a sparse view must not delete what the registry still knows, and the view is
 * sparse exactly when the runner has restarted, which is when an operator is looking.
 *
 * Every value here is measured against the moment of the read — the lag most of all — so re-reading is
 * offered rather than the age of the answer being stated.
 *
 * The clamp and the required rebuild are **not** restated here. They are already raised as alerts above
 * the tab strip, in the same words, and a reader who has just read the alert does not need to meet it
 * again two sections down.
 *
 * A member either service omitted is left out. These appear as the pipeline runs, and a row of em
 * dashes would state absence where there is simply nothing yet.
 */
const PipelineRuntime: FC<Props> = ({
  pipeline,
  runtime,
  isGenerationBehind,
  failures,
  canDeadLetter,
  isPaused,
  onReload,
  actions,
}) => {
  const t = useI18n();

  const state = pipeline.state;
  const { outcome, view } = runtime;
  const { schedule, progress, queue, groups, spend_today: spend } = view ?? {};

  // Resolved per field, not per source. Gating the registry's copy on "a view was read" deleted what
  // the registry still knew whenever the runner answered without knowing it — the ordinary shape of
  // its answer after a restart, since it holds these in memory.
  const nextRunAt = schedule?.next_run_at ?? state?.next_run_at;
  const lagSeconds = progress?.lag_seconds ?? state?.lag_seconds;
  const hasMore = progress?.has_more ?? state?.has_more;

  // The registry's own run-level failure. Judged on the raw member: the formatted timestamp lands
  // after the first render, so a gate read from it would drop the row and then pop it back in.
  const hasRunFailure = Boolean(state?.last_error);

  const hasSchedule = Boolean(schedule?.last_scan_at || state?.last_run_at || nextRunAt || schedule?.running_now);
  const hasProgress = Boolean(
    lagSeconds != null || hasMore != null || progress?.caught_up_at || progress?.last_write_at,
  );
  const hasPosition = Boolean(
    state &&
    (state.cursor_version != null ||
      state.cursor_identity ||
      state.materialized_through_version != null ||
      state.materialized_through_identity ||
      state.drained_at),
  );
  const hasAnyFact = hasSchedule || hasProgress || hasPosition || hasRunFailure || !!queue || !!groups || !!spend;

  // Nothing is stated until something is known. A verdict published before the runner has answered is
  // wrong however it is worded, and each of the four below is a verdict.
  const isPending = outcome === RuntimeReadOutcome.Pending;
  // The runner refused or did not arrive. A cold runner and a pipeline it does not hold are **not**
  // this: each is a definite answer, stated in its own words — the first below, the second by the
  // frame's warning above the tab strip.
  const isRunnerUnread = outcome === RuntimeReadOutcome.Failed;
  // Neither service had anything to say and neither failed: no runner to ask, and the registry served
  // no state at all.
  const isRegistryUnread = outcome === RuntimeReadOutcome.Unavailable && !state;
  // The runner answered and holds the pipeline but has recorded nothing about it yet — a
  // synced-but-not-yet-fired pipeline, which is not the same as one that has never run.
  const isNothingYet = outcome === RuntimeReadOutcome.Read && !hasAnyFact;
  // No runner answer to draw on, and nothing in the registry either. A pipeline that reports a failure
  // is never among them: it ran, and saying otherwise sends an operator looking for one that never
  // started.
  const isNeverRun = !isPending && !view && !isRunnerUnread && !isRegistryUnread && Boolean(state) && !hasAnyFact;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-y-4">
      <div className="flex flex-row flex-wrap items-center justify-end gap-3">
        {/* Both upstreams, not a page reload: the state comes with the pipeline and the runtime view,
            the pause and the failures from the frame's own reads. Outlined, because it only re-reads —
            the control that changes something stands beside it in solid. */}
        <Button
          variant={ButtonVariant.Neutral}
          appearance={ButtonAppearance.Outlined}
          label={t(AnalyticsPipelinesI18nKey.RuntimeReadAgain)}
          iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
          onClick={onReload}
        />
        {actions}
      </div>

      {/* A runner that has not finished starting. Information rather than a warning: it clears on its
          own within a sync, and the reader's move is to read again rather than to investigate. */}
      {outcome === RuntimeReadOutcome.Cold && (
        <Notification
          variant={NotificationVariant.Info}
          type={NotificationType.SectionMessage}
          role="status"
          title={t(AnalyticsPipelinesI18nKey.RuntimeColdTitle)}
          message={t(AnalyticsPipelinesI18nKey.RuntimeCold)}
        />
      )}

      {/* The runner is a sync behind the save on screen. Information, not a fault: it syncs on its own
          cadence, and this is the ordinary state for the minute after an operator saves. */}
      {isGenerationBehind && view && (
        <Notification
          variant={NotificationVariant.Info}
          type={NotificationType.SectionMessage}
          role="status"
          title={t(AnalyticsPipelinesI18nKey.RuntimeGenerationBehindTitle)}
          message={t(AnalyticsPipelinesI18nKey.RuntimeGenerationBehind, {
            runner: view.generation,
            registry: pipeline.generation,
          })}
        />
      )}

      {/* The service's own words **and** the console's. The message says what went wrong; the sentence
          after it says what did not, which is the half an operator acts on — and the service's message
          is never empty, so an `||` between them made the second unreachable. */}
      {(isRunnerUnread || isRegistryUnread) && (
        <Notification
          variant={NotificationVariant.Warning}
          type={NotificationType.SectionMessage}
          role="status"
          title={t(AnalyticsPipelinesI18nKey.RuntimeUnavailableTitle)}
          message={[
            runtime.errorMessage || t(AnalyticsPipelinesI18nKey.RuntimeUnavailable),
            t(AnalyticsPipelinesI18nKey.RuntimeUnaffected),
          ].join(' ')}
        />
      )}

      {/* The runner holds it and has reported nothing yet — a different statement from never having
          run, and the one case that would otherwise leave the tab blank with no explanation. */}
      {isNothingYet && (
        <div className="flex flex-1 items-center justify-center">
          <NoDataContent title={t(AnalyticsPipelinesI18nKey.RuntimeNothingYet)} />
        </div>
      )}

      {isNeverRun && (
        <div className="flex flex-1 items-center justify-center">
          <NoDataContent title={t(AnalyticsPipelinesI18nKey.NeverRun)} />
        </div>
      )}

      <div className="flex flex-col gap-4">
        <RuntimeSection title={t(AnalyticsPipelinesI18nKey.SectionSchedule)}>
          {schedule?.last_scan_at && (
            <LabelledDate label={t(AnalyticsPipelinesI18nKey.LastScan)} at={schedule.last_scan_at} />
          )}
          {state?.last_run_at && <LabelledDate label={t(AnalyticsPipelinesI18nKey.LastRun)} at={state.last_run_at} />}
          {/* The service omits the next fire while one is running, so the two never both apply. */}
          {schedule?.running_now && (
            <LabelledText
              className={UNCAPPED}
              label={t(AnalyticsPipelinesI18nKey.NextRun)}
              text={t(AnalyticsPipelinesI18nKey.RunningNowYes)}
            />
          )}
          {!schedule?.running_now && nextRunAt && (
            <LabelledDate label={t(AnalyticsPipelinesI18nKey.NextRun)} at={nextRunAt} />
          )}
          {labelledCount(t(AnalyticsPipelinesI18nKey.ConsecutiveFailures), schedule?.consecutive_failures)}
          {schedule?.last_error && (
            <LabelledText
              className={UNCAPPED}
              label={t(AnalyticsPipelinesI18nKey.LastError)}
              text={schedule.last_error}
            />
          )}
          {schedule?.last_error_at && (
            <LabelledDate label={t(AnalyticsPipelinesI18nKey.LastErrorAt)} at={schedule.last_error_at} />
          )}
        </RuntimeSection>

        {/* The scan's position against its input. Its own card rather than a corner of the registry's:
            the runner measures it, and the cursor pair below is a different service's answer to a
            different question. */}
        <RuntimeSection title={t(AnalyticsPipelinesI18nKey.SectionProgress)}>
          {lagSeconds != null && (
            <LabelledText
              className={UNCAPPED}
              label={t(AnalyticsPipelinesI18nKey.Lag)}
              text={t(AnalyticsPipelinesI18nKey.LagSeconds, { count: lagSeconds })}
              tooltip={queue ? t(AnalyticsPipelinesI18nKey.LagHint) : undefined}
            />
          )}
          {hasMore != null && (
            <LabelledText
              className={UNCAPPED}
              label={t(AnalyticsPipelinesI18nKey.Backlog)}
              text={t(hasMore ? AnalyticsPipelinesI18nKey.BacklogYes : AnalyticsPipelinesI18nKey.BacklogNo)}
            />
          )}
          {progress?.caught_up_at && (
            <LabelledDate label={t(AnalyticsPipelinesI18nKey.CaughtUpAt)} at={progress.caught_up_at} />
          )}
          {progress?.last_write_at && (
            <LabelledDate label={t(AnalyticsPipelinesI18nKey.LastWriteAt)} at={progress.last_write_at} />
          )}
        </RuntimeSection>

        {/* The registry's own position members, which the runner's view does not carry. */}
        <RuntimeSection title={t(AnalyticsPipelinesI18nKey.SectionState)}>
          {labelledCount(t(AnalyticsPipelinesI18nKey.CursorVersion), state?.cursor_version)}
          {state?.cursor_identity && (
            <LabelledText
              className={UNCAPPED}
              label={t(AnalyticsPipelinesI18nKey.CursorIdentity)}
              text={state.cursor_identity}
            />
          )}
          {labelledCount(t(AnalyticsPipelinesI18nKey.MaterializedThroughVersion), state?.materialized_through_version)}
          {state?.materialized_through_identity && (
            <LabelledText
              className={UNCAPPED}
              label={t(AnalyticsPipelinesI18nKey.MaterializedThroughIdentity)}
              text={state.materialized_through_identity}
            />
          )}
          {/* With the caveat attached: it advances only on an empty probe, so on a busy pipeline it is
              old while everything is working. */}
          {state?.drained_at && (
            <LabelledDate
              label={t(AnalyticsPipelinesI18nKey.DrainedAt)}
              at={state.drained_at}
              tooltip={t(AnalyticsPipelinesI18nKey.DrainedAtHint)}
            />
          )}
        </RuntimeSection>

        {/* Beside the lag rather than under it: the scan advances when work is enqueued, so these are
            what say whether a caught-up pipeline has actually written its rows. */}
        {queue && (
          <RuntimeSection title={t(AnalyticsPipelinesI18nKey.SectionQueue)}>
            {labelledCount(t(AnalyticsPipelinesI18nKey.QueueComputing), queue.computing)}
            {labelledCount(t(AnalyticsPipelinesI18nKey.QueueAwaitingWrite), queue.awaiting_write)}
          </RuntimeSection>
        )}

        {groups && (
          <RuntimeSection title={t(AnalyticsPipelinesI18nKey.SectionGroups)}>
            {labelledCount(t(AnalyticsPipelinesI18nKey.GroupsPending), groups.pending)}
            {labelledCount(t(AnalyticsPipelinesI18nKey.GroupsReady), groups.ready)}
            {labelledCount(t(AnalyticsPipelinesI18nKey.GroupsWaitingIdle), groups.waiting_idle)}
            {labelledCount(t(AnalyticsPipelinesI18nKey.GroupsCeilingBlocked), groups.ceiling_blocked)}
          </RuntimeSection>
        )}

        {spend && (
          <RuntimeSection title={t(AnalyticsPipelinesI18nKey.SectionSpend)}>
            {labelledCount(t(AnalyticsPipelinesI18nKey.SpendCalls), spend.calls)}
            {labelledCount(t(AnalyticsPipelinesI18nKey.SpendTokens), spend.tokens)}
            {labelledCount(t(AnalyticsPipelinesI18nKey.SpendFailedCalls), spend.failed_calls)}
          </RuntimeSection>
        )}

        {/* The run's own failure, which the registry records for the kinds it drives itself. Its own
            group rather than a line in the failures card: that card lists the dead letters of a
            model-calling enrichment, and this is the opposite kind of fact — one verdict on a whole
            run. The alert above the tab strip carries the message; what this adds is when.
            Its own label rather than the runner's `Last error`: that row carries a message and this one
            a time, and two rows reading "Last error" on one tab say nothing about which is which. */}
        <RuntimeSection title={t(AnalyticsPipelinesI18nKey.SectionFailures)}>
          {hasRunFailure && (
            <LabelledDate
              label={t(AnalyticsPipelinesI18nKey.RunFailedAt)}
              at={state?.last_run_at}
              fallback={t(AnalyticsPipelinesI18nKey.NotSet)}
            />
          )}
        </RuntimeSection>
      </div>

      {/* The dead letters of a model-calling enrichment. Governed by the runner rather than by `state`,
          so it is presented independently of the content states above: a pipeline whose state was
          reset can still hold failures from before. */}
      {canDeadLetter && <PipelineFailuresCard pipeline={pipeline} failures={failures} isPaused={isPaused} />}
    </div>
  );
};

export default PipelineRuntime;
