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

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useLocalDateTimeString } from '@/src/hooks/use-local-date-time-string';
import { useI18n } from '@/src/locales/client';
import { Pipeline } from '@/src/models/analytics/pipeline';

interface Props {
  pipeline: Pipeline;
  /**
   * Reads both upstreams again — the pipeline through the page, and the runner through the frame's own
   * hook. The frame owns it because only the frame holds the second one.
   */
  onReload: () => void;
  /** The pause control, which the frame owns: it holds the runner read and the confirmation. */
  actions?: ReactNode;
}

/**
 * One group of runtime facts. The groups are separated by a rule rather than boxed: three bordered
 * cards in a column draw two lines where one says the same thing, and this content already sits inside
 * a panel of its own. The heading is small and quiet on purpose — it names the group, and the values
 * inside it are what the reader came for.
 *
 * A group whose every member the service omitted renders nothing at all. A heading over an empty row
 * states that something is missing, where the truth is that this kind of pipeline has no such facts —
 * an on-ingest pipeline has no schedule, and a bare `SCHEDULE` above white space reads as a fault.
 */
/**
 * Undoes `DialLabelledText`'s own 200px cap. That default suits a dense form; this tab gives each value
 * a third of the page, and a truncated cursor identity is one nobody can read or copy.
 */
const UNCAPPED = 'max-w-none';

const RuntimeSection: FC<{ title: string; children: ReactNode }> = ({ title, children }) => {
  const rendered = Array.isArray(children) ? children.flat() : [children];
  if (!rendered.some(Boolean)) return null;

  return (
    <section aria-label={title} className="flex flex-col gap-4 py-6 first:pt-0 last:pb-0">
      <h3 className="dial-small-semi-text uppercase tracking-wide text-secondary">{title}</h3>
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
};

/**
 * The runtime the service reports, in the groups an operator reads it by.
 *
 * Every value here is measured against the moment of the read — the lag most of all — so the tab states
 * how old its answer is rather than presenting it as current. Re-reading is the page's own refresh: the
 * state arrives with the pipeline, so there is one copy of it rather than a second, client-side one that
 * could disagree with the server component's.
 *
 * The clamp and the required rebuild are **not** restated here. They are already raised as alerts above
 * the tab strip, in the same words, and a reader who has just read the alert does not need to meet it
 * again two sections down.
 *
 * A member the service omitted is left out. These appear as the pipeline runs, and a row of em dashes
 * would state absence where there is simply nothing yet.
 */
const PipelineRuntime: FC<Props> = ({ pipeline, onReload, actions }) => {
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
  const hasFailure = Boolean(state?.last_error);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-y-4">
      <div className="flex flex-row flex-wrap items-center justify-end gap-3">
        {/* Both upstreams, not a page reload: the state comes with the pipeline and the pause from the
            frame's own read. Outlined, because it only re-reads — the control that changes something
            stands beside it in solid. */}
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

      {/* The one case with nothing to lay out: it takes the space the sections would have had, rather
          than sitting under the control bar with an empty page beneath it. */}
      {state && !hasSchedule && !hasProgress && !hasFailure && (
        <div className="flex flex-1 items-center justify-center">
          <NoDataContent title={t(AnalyticsPipelinesI18nKey.NeverRun)} />
        </div>
      )}

      {state && (
        <div className="flex flex-col divide-y divide-primary">
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
            {/* Under progress rather than under schedule, and with the caveat attached: it advances only
                on an empty probe, so on a busy pipeline it is old while everything is working. */}
            {drainedAt && (
              <LabelledText
                className={UNCAPPED}
                label={t(AnalyticsPipelinesI18nKey.DrainedAt)}
                text={drainedAt}
                tooltip={t(AnalyticsPipelinesI18nKey.DrainedAtHint)}
              />
            )}
          </RuntimeSection>

          {/* Only when something failed. An em dash here answered a question nobody asked — a pipeline
              that has never failed says so by this section being absent, the way a pipeline with no
              schedule says so. The service reports no timestamp for the failure — `last_error` is the
              last run's — so the run's own time is what places it, and the alert above the tab strip
              carries the message itself. */}
          <RuntimeSection title={t(AnalyticsPipelinesI18nKey.SectionFailures)}>
            {state.last_error && (
              <LabelledText
                className={UNCAPPED}
                label={t(AnalyticsPipelinesI18nKey.LastError)}
                text={lastRunAt || t(AnalyticsPipelinesI18nKey.NotSet)}
              />
            )}
          </RuntimeSection>
        </div>
      )}
    </div>
  );
};

export default PipelineRuntime;
