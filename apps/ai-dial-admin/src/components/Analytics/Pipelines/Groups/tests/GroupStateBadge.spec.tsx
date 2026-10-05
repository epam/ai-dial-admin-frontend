import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import GroupStateBadge from '@/src/components/Analytics/Pipelines/Groups/GroupStateBadge';
import { GroupState } from '@/src/components/Analytics/Pipelines/Groups/models';
import { groupMock, HOUR, isoAgo, MINUTE, NOW } from '@/src/components/Analytics/Pipelines/Groups/tests/mock';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { PipelineGroup } from '@/src/models/analytics/pipeline-groups';
import { ReadyWhen } from '@/src/models/analytics/pipeline';

const focusBadge = async (group: PipelineGroup, state: GroupState, readyWhen: ReadyWhen, isPaused = false) => {
  const user = userEvent.setup();
  render(<GroupStateBadge group={group} state={state} readyWhen={readyWhen} isPaused={isPaused} now={NOW} />);

  await user.tab();
};

describe('GroupStateBadge', () => {
  test('is focusable and states its label', async () => {
    await focusBadge(groupMock(), GroupState.Waiting, { idle: '10m' });

    expect(screen.getByText(AnalyticsPipelinesI18nKey.GroupStateWaiting)).toHaveFocus();
  });

  test('explains a waiting group by its triggers and the time left', async () => {
    await focusBadge(groupMock(), GroupState.Waiting, { idle: '10m', signal: 'x = 1' });

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.GroupsCheckIdle)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.GroupsCheckIdleLeft, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.GroupsCheckSignalNotMet)).toBeInTheDocument();
  });

  test('states when an at-cap group resets', async () => {
    const group = groupMock({ last_activity_at: isoAgo(20 * MINUTE), evaluations: 20 });
    await focusBadge(group, GroupState.AtCap, { idle: '10m', cost_ceiling: 20 });

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.GroupsCheckCeiling)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.GroupsCheckCeilingReset, { exact: false })).toBeInTheDocument();
  });

  test('states a default idle as a fact without a threshold', async () => {
    const group = groupMock({ last_activity_at: isoAgo(40 * MINUTE) });
    await focusBadge(group, GroupState.Waiting, { signal: 'x = 1' });

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.GroupsCheckDefaultIdle)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.GroupsCheckIdleLeft)).toBeNull();
  });

  test('states a pause before the checklist of a ready group', async () => {
    const group = groupMock({ last_activity_at: isoAgo(20 * MINUTE) });
    await focusBadge(group, GroupState.Ready, { idle: '10m' }, true);

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.GroupsHintPaused)).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.GroupsHintReady)).toBeNull();
  });

  test('says a ready group is taken on the next pass', async () => {
    const group = groupMock({ last_activity_at: isoAgo(20 * MINUTE) });
    await focusBadge(group, GroupState.Ready, { idle: '10m' });

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.GroupsHintReady)).toBeInTheDocument();
  });

  test('says when an up-to-date group was evaluated', async () => {
    const group = groupMock({ dirty: false, computed_at: isoAgo(HOUR) });
    await focusBadge(group, GroupState.UpToDate, { idle: '10m' });

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.GroupsHintUpToDate)).toBeInTheDocument();
  });
});
