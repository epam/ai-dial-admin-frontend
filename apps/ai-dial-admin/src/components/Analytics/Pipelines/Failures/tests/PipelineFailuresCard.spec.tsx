import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import PipelineFailuresCard from '@/src/components/Analytics/Pipelines/Failures/PipelineFailuresCard';
import { PipelineFailuresRead } from '@/src/components/Analytics/Pipelines/Failures/use-pipeline-failures';
import { PIPELINE, dlqItem, failuresRead } from '@/src/components/Analytics/Pipelines/Failures/tests/mock';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { DlqLane } from '@/src/models/analytics/pipeline-dlq';

const { requeueFailure, requeueFailures } = vi.hoisted(() => ({
  requeueFailure: vi.fn(),
  requeueFailures: vi.fn(),
}));

vi.mock('@/src/app/[lang]/pipelines/actions', () => ({ requeueFailure, requeueFailures }));

// The grid is ag-grid; this spec is about the card's own behaviour, so the grid is reduced to a marker.
vi.mock('@/src/components/Analytics/Pipelines/Failures/FailuresGrid', () => ({
  default: () => <section aria-label="failures grid" />,
}));

const renderCard = (failures: PipelineFailuresRead, isPaused = false) =>
  render(<PipelineFailuresCard pipeline={PIPELINE} failures={failures} isPaused={isPaused} />);

describe('PipelineFailuresCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('states the total and the split the service counted', () => {
    renderCard(failuresRead({ counts: { total: 37, retryable: 21, notRetryable: 16 } }));

    expect(screen.getByText('37')).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.FailuresRetryable)).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.FailuresNotRetryable)).toBeTruthy();
  });

  // The counters describe the filter the summary read used — the whole pipeline — so a path chosen
  // below cannot move them.
  test('keeps the headline when the grid is narrowed to one path', () => {
    renderCard(
      failuresRead({
        items: [dlqItem()],
        counts: { total: 37, retryable: 21, notRetryable: 16 },
        filters: { lane: DlqLane.Live },
      }),
    );

    expect(screen.getByText('37')).toBeTruthy();
  });

  test('opens the grid inside the card and states that it is expanded', async () => {
    const user = userEvent.setup();
    renderCard(failuresRead({ items: [dlqItem()] }));

    const toggle = screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresShowAll });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBeTruthy();

    await user.click(toggle);

    expect(screen.getByRole('region', { name: 'failures grid' })).toBeTruthy();
    expect(
      screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresHide }).getAttribute('aria-expanded'),
    ).toBe('true');
  });

  test('offers no bulk retry when the service counted nothing it would re-run', () => {
    renderCard(failuresRead({ counts: { total: 4, retryable: 0, notRetryable: 4 } }));

    expect(screen.queryByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresRetryAll })).toBeNull();
  });

  test('confirms a bulk retry in a dialog and sends nothing when it is cancelled', async () => {
    const user = userEvent.setup();
    renderCard(failuresRead({ items: [dlqItem()] }));

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresRetryAll }));

    expect(screen.getByText(AnalyticsPipelinesI18nKey.FailuresRetryAllTitle)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Buttons.Cancel' }));

    expect(requeueFailures).not.toHaveBeenCalled();
  });

  // The service selects by pipeline and nothing else, so the request must carry no filter.
  test('sends a confirmed bulk retry for the whole pipeline', async () => {
    const user = userEvent.setup();
    requeueFailures.mockResolvedValue({ success: true, response: { requeued: 1 } });
    renderCard(failuresRead({ items: [dlqItem()] }));

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresRetryAll }));
    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresRetry }));

    expect(requeueFailures).toHaveBeenCalledWith(PIPELINE.name, undefined);
  });

  // The path is the narrowing the reader is looking at, so the dialog has to name it.
  test('names the path filter the bulk retry will ignore', async () => {
    const user = userEvent.setup();
    renderCard(failuresRead({ items: [dlqItem()], filters: { lane: DlqLane.Backfill } }));

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresRetryAll }));

    expect(screen.getByText(AnalyticsPipelinesI18nKey.FailuresRetryIgnoresFilters)).toBeTruthy();
  });

  test('warns in the confirmation that a paused pipeline holds the items in the queue', async () => {
    const user = userEvent.setup();
    renderCard(failuresRead({ items: [dlqItem()] }), true);

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresRetryAll }));

    expect(screen.getByText(AnalyticsPipelinesI18nKey.FailuresRetryWhilePaused)).toBeTruthy();
  });

  test('reports a re-run that sent back fewer items than it asked for', async () => {
    const user = userEvent.setup();
    requeueFailures.mockResolvedValue({ success: true, response: { requeued: 1 } });
    renderCard(failuresRead({ counts: { total: 2, retryable: 2, notRetryable: 0 } }));

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresRetryAll }));
    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresRetry }));

    const status = await screen.findByText(
      (text) =>
        text.includes(AnalyticsPipelinesI18nKey.FailuresRequeued) &&
        text.includes(AnalyticsPipelinesI18nKey.FailuresRequeuedShort),
    );

    expect(status).toBeTruthy();
  });

  // Nothing to report is reported by not being here.
  test('renders nothing for a pipeline the service reports no dead letters for', () => {
    const { container } = renderCard(failuresRead());

    expect(container.firstChild).toBeNull();
  });

  // The counters start at zero and only a read moves them, so "not yet answered" and "nothing to
  // report" are the same state by construction — which is what keeps the card from appearing as an
  // empty frame and then filling.
  test('renders nothing while the first read is still in flight', () => {
    const { container } = renderCard(failuresRead({ isLoading: true }));

    expect(container.firstChild).toBeNull();
  });

  // Zero is what a successful bulk re-run produces, and it is the moment the card has something to
  // say about what it just did.
  test('stays to report a re-run that emptied the listing', async () => {
    const user = userEvent.setup();
    requeueFailures.mockResolvedValue({ success: true, response: { requeued: 2 } });
    const failures = failuresRead({ counts: { total: 2, retryable: 2, notRetryable: 0 } });
    const { rerender } = renderCard(failures);

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresRetryAll }));
    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresRetry }));

    rerender(<PipelineFailuresCard pipeline={PIPELINE} failures={failuresRead()} isPaused={false} />);

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.FailuresRequeued)).toBeTruthy();
  });

  // An absent runner is a deployment choice, not a fault: it raises no card and no error.
  test('renders nothing when no runner is configured', () => {
    const { container } = renderCard(failuresRead({ isUnavailable: true, hasFailed: false }));

    expect(container.firstChild).toBeNull();
  });

  // Opposite conclusions: a read that failed says nothing about whether anything failed.
  test('states that the failures could not be read rather than that there are none', () => {
    renderCard(failuresRead({ hasFailed: true }));

    expect(screen.getByText(AnalyticsPipelinesI18nKey.FailuresReadFailed)).toBeTruthy();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.FailuresNone)).toBeNull();
    expect(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresReadAgain })).toBeTruthy();
  });

  test('reads the failures again when asked', async () => {
    const user = userEvent.setup();
    const failures = failuresRead({ hasFailed: true });
    renderCard(failures);

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresReadAgain }));

    expect(failures.reload).toHaveBeenCalledOnce();
  });
});
