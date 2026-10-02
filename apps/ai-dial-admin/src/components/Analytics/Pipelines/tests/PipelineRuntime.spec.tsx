import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import PipelineRuntime from '@/src/components/Analytics/Pipelines/PipelineRuntime';
import { dlqItem, failuresRead } from '@/src/components/Analytics/Pipelines/Failures/tests/mock';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { Pipeline, PipelineKind, PipelineState, TriggerKind } from '@/src/models/analytics/pipeline';

const pipeline = (state?: PipelineState): Pipeline => ({
  name: 'usage-client-identity-live',
  kind: PipelineKind.Enrich,
  target: 'usage_client_identity',
  trigger: { kind: TriggerKind.OnIngest },
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
 * No failures read at all, which is what an aggregate pipeline and an unconfigured runner both look
 * like. The failures card's own behaviour is covered in `PipelineFailuresCard.spec.tsx`.
 */
const renderRuntime = (state?: PipelineState) =>
  render(
    <PipelineRuntime
      pipeline={pipeline(state)}
      failures={failuresRead()}
      canDeadLetter={false}
      isPaused={false}
      onReload={onReload}
    />,
  );

describe('PipelineRuntime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('groups the schedule and the state under their own headings', () => {
    renderRuntime(RAN);

    expect(screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionSchedule })).toBeTruthy();
    expect(screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionState })).toBeTruthy();
  });

  test('presents the cursor and materialized-through positions the facts row cannot hold', () => {
    renderRuntime(RAN);

    expect(screen.getByText('1758471128')).toBeTruthy();
    expect(screen.getByText('evt_01J9K2M4P7QXR3')).toBeTruthy();
    expect(screen.getByText('1758471090')).toBeTruthy();
    expect(screen.getByText('evt_01J9K2M4P7QXQ8')).toBeTruthy();
  });

  // It advances only on an empty probe, so beside the schedule it would read as the last sign of life.
  test('files drained-at under state rather than under the schedule', () => {
    renderRuntime(RAN);

    const state = screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionState });
    const schedule = screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionSchedule });

    expect(state.textContent).toContain(AnalyticsPipelinesI18nKey.DrainedAt);
    expect(schedule.textContent).not.toContain(AnalyticsPipelinesI18nKey.DrainedAt);
  });

  test('says a pipeline has not run yet rather than presenting placeholders', () => {
    renderRuntime({});

    expect(screen.getByText(AnalyticsPipelinesI18nKey.NeverRun)).toBeTruthy();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.LastRun)).toBeNull();
  });

  test('says the runtime could not be read when the pipeline carries no state', () => {
    renderRuntime(undefined);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.RuntimeUnavailableTitle)).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.RuntimeUnavailable)).toBeTruthy();
  });

  test('leaves out a measured member the service did not report', () => {
    renderRuntime({ last_run_at: '2026-09-21T16:12:08Z' });

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.Lag)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.CursorVersion)).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.DrainedAt)).toBeNull();
  });

  // The message itself is the alert's above the tab strip; what this tab adds is when it happened.
  test('dates the last failure by the run it came from, without repeating the alert', () => {
    renderRuntime({ ...RAN, last_error: 'evaluator call failed: upstream returned 503' });

    const failures = screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionFailures });

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

  // ADAS records `last_run_at` only for the kinds it drives on a schedule; an on-ingest pipeline the
  // runner drives has none of it while working perfectly, and used to be told it had never run.
  test('does not call an on-ingest pipeline never-run when it reports progress', () => {
    renderRuntime({ materialized_through_version: 1790691421686, drained_at: '2026-09-29T16:19:44Z' });

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.NeverRun)).toBeNull();
    expect(screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.SectionState })).toBeTruthy();
  });

  // An on-ingest pipeline has no schedule at all, and a heading over white space reads as a fault.
  test('renders no section for a group whose every member the service omitted', () => {
    renderRuntime({ materialized_through_version: 1790691421686 });

    expect(screen.queryByRole('region', { name: AnalyticsPipelinesI18nKey.SectionSchedule })).toBeNull();
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
    render(
      <PipelineRuntime
        pipeline={pipeline({})}
        failures={failuresRead({ items: [dlqItem()] })}
        canDeadLetter
        isPaused={false}
        onReload={onReload}
      />,
    );

    expect(screen.getByRole('region', { name: AnalyticsPipelinesI18nKey.FailuresTitle })).toBeTruthy();
    // And the registry's own verdict stands beside it: the two services answer different questions.
    expect(screen.getByText(AnalyticsPipelinesI18nKey.NeverRun)).toBeTruthy();
  });

  // The screen the operator actually meets first: nothing has failed, so no heading over an empty card.
  test('draws no failures card for a pipeline with no dead letters', () => {
    render(
      <PipelineRuntime
        pipeline={pipeline({})}
        failures={failuresRead()}
        canDeadLetter
        isPaused={false}
        onReload={onReload}
      />,
    );

    expect(screen.queryByRole('region', { name: AnalyticsPipelinesI18nKey.FailuresTitle })).toBeNull();
  });

  test('renders the actions its caller supplies in the control bar', () => {
    render(
      <PipelineRuntime
        pipeline={pipeline(RAN)}
        failures={failuresRead()}
        canDeadLetter={false}
        isPaused={false}
        onReload={onReload}
        actions={<button>Pause</button>}
      />,
    );

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
