import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import FailureRowDetail from '@/src/components/Analytics/Pipelines/Failures/FailureRowDetail';
import { dlqItem } from '@/src/components/Analytics/Pipelines/Failures/tests/mock';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { DlqItem, DlqStage } from '@/src/models/analytics/pipeline-dlq';
import { TriggerKind } from '@/src/models/analytics/pipeline';

const onFilterByRun = vi.fn();
const onRetryRun = vi.fn();

const renderDetail = (data: DlqItem, props: Partial<Parameters<typeof FailureRowDetail>[0]> = {}) =>
  render(
    <FailureRowDetail
      item={data}
      trigger={TriggerKind.Schedule}
      isBusy={false}
      runRetryableCount={2}
      onFilterByRun={onFilterByRun}
      onRetryRun={onRetryRun}
      {...props}
    />,
  );

describe('FailureRowDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('states the item identity, its scope and the declaration revision', () => {
    renderDetail(dlqItem({ id: 48226 }));

    expect(screen.getByText('48226')).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.FailuresId)).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.FailuresScope)).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
  });

  test('offers to copy the id, the grain key and the message', () => {
    renderDetail(dlqItem({ grain_key: 'resp-1', error: 'boom' }));

    for (const label of [
      AnalyticsPipelinesI18nKey.FailuresId,
      AnalyticsPipelinesI18nKey.FailuresGrainKey,
      AnalyticsPipelinesI18nKey.FailuresError,
    ]) {
      expect(screen.getByRole('button', { name: `copy ${label}` })).toBeTruthy();
    }
  });

  test('offers no copy for a grain key the item does not carry', () => {
    renderDetail(dlqItem({ grain_key: null }));

    expect(screen.queryByRole('button', { name: `copy ${AnalyticsPipelinesI18nKey.FailuresGrainKey}` })).toBeNull();
  });

  // On a group pipeline the grain key holds the group's key, so the derivation would state the
  // opposite of the truth and nothing is stated instead.
  test('states no scope on a group pipeline', () => {
    renderDetail(dlqItem({ grain_key: 'group-1' }), { trigger: TriggerKind.Group });

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.FailuresScope)).toBeNull();
  });

  test('says what a missing grain key means instead of leaving it blank', () => {
    renderDetail(dlqItem({ grain_key: null, stage: DlqStage.Upsert }));

    expect(screen.getByText(AnalyticsPipelinesI18nKey.FailuresGrainWriteItem)).toBeTruthy();
  });

  test('describes the stage in the detail, where a keyboard reader can reach it', () => {
    renderDetail(dlqItem({ stage: DlqStage.Validate }));

    expect(screen.getByText(AnalyticsPipelinesI18nKey.FailuresStageValue)).toBeTruthy();
  });

  test('presents a multi-part validation message one failure per line', () => {
    renderDetail(dlqItem({ error: 'first failure; second failure' }));

    expect(screen.getByText('first failure')).toBeTruthy();
    expect(screen.getByText('second failure')).toBeTruthy();
  });

  // The column is nullable and the service omits a null key; the detail says so rather than blanking.
  test('says so when the service recorded no message', () => {
    renderDetail(dlqItem({ error: undefined }));

    expect(screen.getByText(AnalyticsPipelinesI18nKey.FailuresNoMessage)).toBeTruthy();
  });

  test('offers no run controls for a live failure', () => {
    renderDetail(dlqItem());

    expect(screen.queryByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresFilterByRun })).toBeNull();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.FailuresRun)).toBeNull();
  });

  test('names the run of a backfill failure and offers to narrow the grid to it', async () => {
    const user = userEvent.setup();
    renderDetail(dlqItem({ run_id: 'run-7' }));

    expect(screen.getByText('run-7')).toBeTruthy();
    // There is no run page in the console, so the value is text rather than a link.
    expect(screen.queryByRole('link', { name: 'run-7' })).toBeNull();

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresFilterByRun }));

    expect(onFilterByRun).toHaveBeenCalledWith('run-7');
  });

  test('withholds the run filter while that run is already in force', () => {
    renderDetail(dlqItem({ run_id: 'run-7' }), { filteredRunId: 'run-7' });

    expect(screen.queryByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresFilterByRun })).toBeNull();
  });

  // Scoped to the run, so it carries the run's own count and offers itself whatever this row is.
  test('offers to re-run the whole run from a row the service would not re-run on its own', async () => {
    const user = userEvent.setup();
    renderDetail(dlqItem({ run_id: 'run-7', requeueable: false }), { runRetryableCount: 400 });

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresRetryRun }));

    expect(onRetryRun).toHaveBeenCalledWith('run-7', 400);
  });

  test('withholds the run re-run while its count is still being read', () => {
    renderDetail(dlqItem({ run_id: 'run-7' }), { runRetryableCount: undefined });

    expect(screen.queryByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresRetryRun })).toBeNull();
  });

  test('withholds the run re-run when the run has nothing the service would send', () => {
    renderDetail(dlqItem({ run_id: 'run-7' }), { runRetryableCount: 0 });

    expect(screen.queryByRole('button', { name: AnalyticsPipelinesI18nKey.FailuresRetryRun })).toBeNull();
  });
});
