import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import PipelineRuntime from '@/src/components/Analytics/Pipelines/PipelineRuntime';
import { dlqItem, failuresRead } from '@/src/components/Analytics/Pipelines/Failures/tests/mock';
import { noRuntimeRead, runtimeRead, runtimeView } from '@/src/components/Analytics/Pipelines/Common/tests/mock';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { Pipeline, PipelineKind, PipelineState, TriggerKind } from '@/src/models/analytics/pipeline';
import { RuntimeReadOutcome } from '@/src/models/analytics/pipeline-runtime';

const pipeline = (state?: PipelineState): Pipeline => ({
  name: 'usage-client-identity-live',
  kind: PipelineKind.Enrich,
  target: 'usage_client_identity',
  trigger: { kind: TriggerKind.Schedule },
  enabled: true,
  generation: 7,
  created_at: '2026-08-24T20:27:08Z',
  updated_at: '2026-09-16T00:21:12Z',
  state,
});

const RAN: PipelineState = {
  last_run_at: '2026-09-21T16:12:08Z',
  next_run_at: '2026-09-21T16:13:08Z',
  lag_seconds: 38,
  has_more: true,
  cursor_version: 1758471128,
  cursor_identity: 'evt_01J9K2M4P7QXR3',
  materialized_through_version: 1758471090,
  materialized_through_identity: 'evt_01J9K2M4P7QXQ8',
  drained_at: '2026-09-25T14:59:53Z',
};

const onReload = vi.fn();

/**
 * Nothing read from either the runner or the failures listing, which is what an aggregate pipeline and
 * an unconfigured runner both look like — so these cases exercise the registry's own state, as they
 * did before the runner served a view. The failures card's own behaviour is covered in
 * `PipelineFailuresCard.spec.tsx`.
 */
const renderRuntime = (state?: PipelineState, props: Partial<Parameters<typeof PipelineRuntime>[0]> = {}) =>
  render(
    <PipelineRuntime
      pipeline={pipeline(state)}
      runtime={noRuntimeRead()}
      isGenerationBehind={false}
      failures={failuresRead()}
      canDeadLetter={false}
      isPaused={false}
      onReload={onReload}
      {...props}
    />,
  );

describe('PipelineRuntime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('groups the schedule, the progress and the registry position under their own headings', () => {
    renderRuntime(RAN);

    expect(screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionSchedule })).toBeTruthy();
    expect(screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionProgress })).toBeTruthy();
    expect(screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionState })).toBeTruthy();
  });

  test('presents the cursor and materialized-through positions the facts row cannot hold', () => {
    renderRuntime(RAN);

    expect(screen.getByText('1,758,471,128')).toBeTruthy();
    expect(screen.getByText('evt_01J9K2M4P7QXR3')).toBeTruthy();
    expect(screen.getByText('1,758,471,090')).toBeTruthy();
    expect(screen.getByText('evt_01J9K2M4P7QXQ8')).toBeTruthy();
  });

  // It advances only on an empty probe, so beside the schedule it would read as the last sign of life.
  test('files drained-at under the registry position rather than under the schedule', () => {
    renderRuntime(RAN);

    const position = screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionState });
    const schedule = screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionSchedule });

    expect(position.textContent).toContain(AnalyticsPipelinesI18nKey.DrainedAt);
    expect(schedule.textContent).not.toContain(AnalyticsPipelinesI18nKey.DrainedAt);
  });

  test('says a pipeline has not run yet rather than presenting placeholders', () => {
    renderRuntime({});

    expect(screen.getByText(AnalyticsPipelinesI18nKey.NeverRun)).toBeTruthy();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.LastRun)).toBeNull();
  });

  test('says the runtime could not be read when neither service reported anything', () => {
    renderRuntime(undefined);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.RuntimeUnavailableTitle)).toBeTruthy();
    expect(
      screen.getByText(
        `${AnalyticsPipelinesI18nKey.RuntimeUnavailable} ${AnalyticsPipelinesI18nKey.RuntimeUnaffected}`,
      ),
    ).toBeTruthy();
  });

  test('leaves out a measured member the service did not report', () => {
    renderRuntime({ last_run_at: '2026-09-21T16:12:08Z' });

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.Lag)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.CursorVersion)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.DrainedAt)).toBeNull();
  });

  // The message itself is the alert's above the tab strip; what this tab adds is when it happened.
  // Its own label, because the runner's `Last error` row beside it carries a message rather than a time.
  test('dates the last failure by the run it came from, without repeating the alert', () => {
    renderRuntime({ ...RAN, last_error: 'evaluator call failed: upstream returned 503' });

    const failures = screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionFailures });

    expect(failures.textContent).toContain(AnalyticsPipelinesI18nKey.RunFailedAt);
    expect(failures.textContent).toContain('9/21/2026');
    expect(failures.textContent).not.toContain('evaluator call failed: upstream returned 503');
  });

  // `PipelineRuntimeAlerts` already states both above the tab strip, in these very words.
  test('does not repeat the clamp and the required rebuild the alerts already raise', () => {
    renderRuntime({
      ...RAN,
      clamp: { enrichment: 'usage_client_identity' },
      rebuild_required: { enrichment: 'usage_client_identity', rederived_at: '2026-09-14T16:00:30Z' },
    });

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.ClampedBy)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RebuildRequired)).toBeNull();
  });

  // The never-run branch reads the raw members, not the formatted timestamps: those are empty until an
  // effect fills them, and a pipeline whose only facts are dates flashed "has not run yet" on open.
  test('does not call a pipeline never-run while its timestamps are still being formatted', () => {
    renderRuntime({ drained_at: '2026-09-29T16:19:44Z' });

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.NeverRun)).toBeNull();
  });

  // ADAS records `last_run_at` only for the kinds it drives itself; an enrichment the runner drives has
  // none of it while working perfectly, and used to be told it had never run.
  test('does not call a runner-driven enrichment never-run when it reports progress', () => {
    renderRuntime({ materialized_through_version: 1790691421686, drained_at: '2026-09-29T16:19:44Z' });

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.NeverRun)).toBeNull();
    expect(screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionState })).toBeTruthy();
  });

  // A runner-driven enrichment has no registry schedule, and a heading over white space reads as a fault.
  test('renders no section for a group whose every member the service omitted', () => {
    renderRuntime({ materialized_through_version: 1790691421686 });

    expect(screen.queryByRole('region', { name: AnalyticsPipelinesI18nKey.SectionSchedule })).toBeNull();
    expect(screen.queryByRole('region', { name: AnalyticsPipelinesI18nKey.SectionProgress })).toBeNull();
    expect(screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionState })).toBeTruthy();
  });

  // A pipeline that has never failed says so by this card being absent, as one with no schedule does.
  test('draws no failures card when nothing has failed and the kind dead-letters nothing', () => {
    renderRuntime(RAN);

    expect(screen.queryByRole('region', { name: AnalyticsPipelinesI18nKey.FailuresTitle })).toBeNull();
  });

  // The registry's own group, which is a different thing from the card above and has to disappear on
  // its own terms: a heading over an empty card reads as a fault.
  test('draws no run-level failures group when the last run did not fail', () => {
    renderRuntime(RAN);

    expect(screen.queryByRole('region', { name: AnalyticsPipelinesI18nKey.SectionFailures })).toBeNull();
  });

  // The failures come from the other service, so the card follows that service and not `state` — a
  // pipeline whose state was reset can still hold dead letters from before.
  test('presents the failures card for a model-calling pipeline that has never run', () => {
    renderRuntime({}, { failures: failuresRead({ items: [dlqItem()] }), canDeadLetter: true });

    expect(screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.FailuresTitle })).toBeTruthy();
    // And the registry's own verdict stands beside it: the two services answer different questions.
    expect(screen.getByText(AnalyticsPipelinesI18nKey.NeverRun)).toBeTruthy();
  });

  // The screen the operator actually meets first: nothing has failed, so no heading over an empty card.
  test('draws no failures card for a pipeline with no dead letters', () => {
    renderRuntime({}, { canDeadLetter: true });

    expect(screen.queryByRole('region', { name: AnalyticsPipelinesI18nKey.FailuresTitle })).toBeNull();
  });

  test('renders the actions its caller supplies in the control bar', () => {
    renderRuntime(RAN, { actions: <button>Pause</button> });

    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
  });

  // Both upstreams: the pipeline comes from the page, the pause from a read only the frame holds.
  test('asks its caller to read both upstreams again', async () => {
    const user = userEvent.setup();
    renderRuntime(RAN);

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.RuntimeReadAgain }));

    expect(onReload).toHaveBeenCalledOnce();
  });
});

describe("PipelineRuntime — the runner's view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderView = (
    read = runtimeRead(),
    state?: PipelineState,
    props: Partial<Parameters<typeof PipelineRuntime>[0]> = {},
  ) => renderRuntime(state, { runtime: read, ...props });

  test('presents a card for each section the service sent', () => {
    renderView();

    expect(screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionSchedule })).toBeTruthy();
    expect(screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionProgress })).toBeTruthy();
    expect(screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionQueue })).toBeTruthy();
    expect(screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionSpend })).toBeTruthy();
  });

  // A section the lane has no answer for is absent, and absence is not zero: a sql transform has no
  // queue at all, where a queue card of zeros would say it has one and it is empty.
  test('draws no card for a section the service omitted', () => {
    renderView(runtimeRead({ view: runtimeView({ queue: undefined, spend_today: undefined }) }));

    expect(screen.queryByRole('region', { name: AnalyticsPipelinesI18nKey.SectionQueue })).toBeNull();
    expect(screen.queryByRole('region', { name: AnalyticsPipelinesI18nKey.SectionSpend })).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.QueueComputing)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.SpendCalls)).toBeNull();
  });

  test('presents the group readiness split for the lane that has it', () => {
    renderView(
      runtimeRead({
        view: runtimeView({ groups: { pending: 3, ready: 1, waiting_idle: 1, ceiling_blocked: 1 } }),
      }),
    );

    const groups = screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionGroups });

    expect(groups.textContent).toContain(AnalyticsPipelinesI18nKey.GroupsWaitingIdle);
    expect(groups.textContent).toContain(AnalyticsPipelinesI18nKey.GroupsCeilingBlocked);
  });

  test('draws no groups card for a lane the service sent none for', () => {
    renderView();

    expect(screen.queryByRole('region', { name: AnalyticsPipelinesI18nKey.SectionGroups })).toBeNull();
  });

  // The counts inside a section are optional too: the service omits one it has not recorded, and a
  // count typed as present is a count rendered without a guard, which throws during render.
  test('survives a section whose counts the runner has not recorded', () => {
    renderView(runtimeRead({ view: runtimeView({ queue: { computing: 4 } }) }));

    const queue = screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionQueue });

    expect(queue.textContent).toContain(AnalyticsPipelinesI18nKey.QueueComputing);
    expect(queue.textContent).not.toContain(AnalyticsPipelinesI18nKey.QueueAwaitingWrite);
  });

  // Zero queued items is a fact about the pipeline, not an absence.
  test('states a count of zero rather than dropping it', () => {
    renderView(runtimeRead({ view: runtimeView({ queue: { computing: 0, awaiting_write: 0 } }) }));

    const queue = screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionQueue });

    expect(queue.textContent).toContain(AnalyticsPipelinesI18nKey.QueueComputing);
    expect(queue.textContent).toContain(AnalyticsPipelinesI18nKey.QueueAwaitingWrite);
  });

  // After a restart the runner knows neither, and an em dash or a zero would state something it did
  // not say.
  test('leaves out a field the runner does not currently know', () => {
    renderView(runtimeRead({ view: runtimeView({ progress: { lag_seconds: 38 } }) }));

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.Backlog)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.CaughtUpAt)).toBeNull();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.Lag)).toBeTruthy();
  });

  // The service omits the next fire while one is running, so the two never both apply.
  test('states that a fire is running in place of the next one', () => {
    renderView(
      runtimeRead({
        view: runtimeView({ schedule: { running_now: true, last_scan_at: '2026-10-05T10:00:00Z' } }),
      }),
    );

    const schedule = screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionSchedule });

    expect(schedule.textContent).toContain(AnalyticsPipelinesI18nKey.RunningNowYes);
    expect(schedule.textContent).not.toContain('10:05');
  });

  // Two services sample at different moments; one row per fact is what keeps the difference between
  // the reads from reading as a fact about the pipeline.
  test('prefers the runner over the registry for a fact both report', () => {
    renderView(runtimeRead({ view: runtimeView({ progress: { lag_seconds: 2 } }) }), RAN);

    expect(screen.getAllByText(AnalyticsPipelinesI18nKey.Lag)).toHaveLength(1);
  });

  // The runner answers sparsely after a restart, and the registry is then the only side that knows.
  // Gating the registry's copy on "a view was read" deleted it in exactly that case.
  test('falls back to the registry for a fact the view omitted', () => {
    renderView(runtimeRead({ view: runtimeView({ progress: {}, schedule: {} }) }), RAN);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.Lag)).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.Backlog)).toBeTruthy();
    expect(screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionSchedule })).toBeTruthy();
  });

  // The registry owns these; the view carries none of them, so they are not a second opinion.
  test('keeps the registry members the view does not report', () => {
    renderView(runtimeRead(), RAN);

    expect(screen.getByText('evt_01J9K2M4P7QXR3')).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.DrainedAt)).toBeTruthy();
  });

  // The runner holds the pipeline and is driving it, whatever the registry recorded about runs.
  test('never calls a pipeline never-run once its view was read', () => {
    renderView(runtimeRead(), {});

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.NeverRun)).toBeNull();
  });

  // A view that was read but carries nothing drawable used to fall through every branch and leave the
  // tab blank with no explanation at all.
  test('says the runner has reported nothing yet rather than drawing an empty tab', () => {
    renderView(
      runtimeRead({
        view: runtimeView({
          schedule: {},
          progress: {},
          queue: undefined,
          spend_today: undefined,
          failures: undefined,
        }),
      }),
    );

    expect(screen.getByText(AnalyticsPipelinesI18nKey.RuntimeNothingYet)).toBeTruthy();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.NeverRun)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeUnavailableTitle)).toBeNull();
  });

  // Each of these is a definite answer, stated in its own words. Reporting them as a failed read put
  // two contradictory notices on the tab at once.
  test('states a cold runner as not read yet and nothing else', () => {
    renderView(runtimeRead({ outcome: RuntimeReadOutcome.Cold }));

    expect(screen.getByText(AnalyticsPipelinesI18nKey.RuntimeColdTitle)).toBeTruthy();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeUnavailableTitle)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.NeverRun)).toBeNull();
  });

  // The frame already raises "nothing is running this pipeline" above the tab strip.
  test('adds nothing of its own for a pipeline the runner does not hold', () => {
    renderView(runtimeRead({ outcome: RuntimeReadOutcome.NotHeld }));

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeUnavailableTitle)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.NeverRun)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeColdTitle)).toBeNull();
  });

  // A verdict published before the runner has answered is wrong however it is worded.
  test('states no verdict while the read is still in flight', () => {
    renderView(runtimeRead({ outcome: RuntimeReadOutcome.Pending }));

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeUnavailableTitle)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.NeverRun)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeNothingYet)).toBeNull();
  });

  // The service's message says what went wrong; the console's sentence says what did not, and an `||`
  // between them made the second unreachable because the service's message is never empty.
  test("states a failed read in the service's own words and still says what is unaffected", () => {
    renderView(runtimeRead({ outcome: RuntimeReadOutcome.Failed, errorMessage: 'runtime store is unavailable' }), RAN);

    const notice = screen.getByText(/runtime store is unavailable/);

    expect(notice.textContent).toContain(AnalyticsPipelinesI18nKey.RuntimeUnaffected);
  });

  // The runner syncs on its own cadence, so this is the ordinary state right after a save — and the
  // one thing that stops an operator reading an unchanged runtime as a save that did nothing.
  test('states that the runner is a revision behind', () => {
    renderView(runtimeRead(), RAN, { isGenerationBehind: true });

    expect(screen.getByText(AnalyticsPipelinesI18nKey.RuntimeGenerationBehindTitle)).toBeTruthy();
  });

  test('says nothing about the revision when the two agree', () => {
    renderView(runtimeRead(), RAN);

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.RuntimeGenerationBehindTitle)).toBeNull();
  });
});
