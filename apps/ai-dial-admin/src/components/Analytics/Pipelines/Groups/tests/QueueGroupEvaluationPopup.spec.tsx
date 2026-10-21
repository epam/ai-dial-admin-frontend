import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import QueueGroupEvaluationPopup from '@/src/components/Analytics/Pipelines/Groups/QueueGroupEvaluationPopup';
import { groupMock, HOUR, isoAgo, NOW } from '@/src/components/Analytics/Pipelines/Groups/tests/mock';
import { AnalyticsPipelinesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { PipelineGroup } from '@/src/models/analytics/pipeline-groups';
import { ReadyWhen } from '@/src/models/analytics/pipeline';

const renderPopup = (group: PipelineGroup, readyWhen: ReadyWhen, isPaused = false, isGenerationBehind = false) => {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  render(
    <QueueGroupEvaluationPopup
      group={group}
      readyWhen={readyWhen}
      isPaused={isPaused}
      isGenerationBehind={isGenerationBehind}
      now={NOW}
      onConfirm={onConfirm}
      onClose={onClose}
    />,
  );

  return { onConfirm, onClose };
};

describe('QueueGroupEvaluationPopup', () => {
  test('lists a waiting group’s triggers and says it is evaluated without waiting', () => {
    renderPopup(groupMock(), { idle: '10m' });

    expect(screen.getByText(AnalyticsPipelinesI18nKey.GroupsQueueWaiting)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.GroupsCheckIdle)).toBeInTheDocument();
  });

  test('warns that an up-to-date group is evaluated again on the same rows', () => {
    renderPopup(groupMock({ dirty: false, computed_at: isoAgo(HOUR) }), { idle: '10m' });

    expect(screen.getByText(AnalyticsPipelinesI18nKey.GroupsQueueUpToDate)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.GroupsQueueWaiting)).toBeNull();
  });

  test('states the limit in use among the facts', () => {
    renderPopup(groupMock({ evaluations: 7 }), { idle: '10m', cost_ceiling: 20 });

    expect(screen.getByText('7 / 20')).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.GroupsQueueCeiling)).toBeNull();
  });

  test('warns only when the evaluation spends the last one of the day', () => {
    renderPopup(groupMock({ evaluations: 19 }), { idle: '10m', cost_ceiling: 20 });

    expect(screen.getByText(AnalyticsPipelinesI18nKey.GroupsQueueCeiling)).toBeInTheDocument();
  });

  test('says a paused pipeline still runs the evaluation', () => {
    renderPopup(groupMock(), { idle: '10m' }, true);
    expect(screen.getByText(AnalyticsPipelinesI18nKey.GroupsQueuePaused)).toBeInTheDocument();
  });

  test('warns when the runner still runs an older revision', () => {
    renderPopup(groupMock(), { idle: '10m' }, false, true);
    expect(screen.getByText(AnalyticsPipelinesI18nKey.GroupsQueueGenerationBehind)).toBeInTheDocument();
  });

  test('says nothing about the revision when the runner is current', () => {
    renderPopup(groupMock(), { idle: '10m' });
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.GroupsQueueGenerationBehind)).toBeNull();
  });

  test('cancelling sends nothing, confirming asks for the evaluation', async () => {
    const user = userEvent.setup();
    const { onConfirm, onClose } = renderPopup(groupMock(), { idle: '10m' });

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.GroupsQueue }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
