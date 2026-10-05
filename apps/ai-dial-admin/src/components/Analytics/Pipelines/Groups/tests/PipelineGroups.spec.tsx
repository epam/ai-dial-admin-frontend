import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import PipelineGroups from '@/src/components/Analytics/Pipelines/Groups/PipelineGroups';
import { GroupRow } from '@/src/components/Analytics/Pipelines/Groups/GroupsGrid';
import { groupMock, HOUR, isoAgo } from '@/src/components/Analytics/Pipelines/Groups/tests/mock';
import { GROUPS_LIMIT } from '@/src/constants/analytics/pipeline-groups';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { Pipeline, PipelineKind, TriggerKind } from '@/src/models/analytics/pipeline';
import { PipelineGroup } from '@/src/models/analytics/pipeline-groups';

const { getPipelineGroups, queueGroupEvaluation } = vi.hoisted(() => ({
  getPipelineGroups: vi.fn(),
  queueGroupEvaluation: vi.fn(),
}));

vi.mock('@/src/app/[lang]/pipelines/actions', () => ({ getPipelineGroups, queueGroupEvaluation }));

interface GridProps {
  rows: GroupRow[];
  onQueue: (group: PipelineGroup) => void;
}

// The grid has its own spec; here it lists the rows it was handed and offers each one's action.
vi.mock('@/src/components/Analytics/Pipelines/Groups/GroupsGrid', () => ({
  default: ({ rows, onQueue }: GridProps) => (
    <ul aria-label="groups">
      {rows.map((row) => (
        <li key={row.group.group_key} aria-label={row.group.group_key}>
          <button type="button" onClick={() => onQueue(row.group)}>
            queue {row.group.group_key}
          </button>
        </li>
      ))}
    </ul>
  ),
}));

const pipeline = {
  name: 'retrieval-quality',
  kind: PipelineKind.Enrich,
  target: 'retrieval_quality',
  trigger: { kind: TriggerKind.Group, group_by: 'session_id', ready_when: { idle: '10m' } },
  enabled: true,
  generation: 3,
} as Pipeline;

const listedKeys = () =>
  within(screen.getByRole('list', { name: 'groups' }))
    .queryAllByRole('listitem')
    .map((item) => item.getAttribute('aria-label'));

const renderTab = async (groups: PipelineGroup[]) => {
  getPipelineGroups.mockResolvedValue({ success: true, response: groups });
  render(<PipelineGroups pipeline={pipeline} isPaused={false} isGenerationBehind={false} />);
  await waitFor(() => expect(listedKeys()).toHaveLength(groups.length));
};

const queueFirstGroup = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'queue sess_A' }));
  await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.GroupsQueue }));
};

describe('PipelineGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('reads the whole window the runner serves', async () => {
    await renderTab([groupMock()]);

    expect(getPipelineGroups).toHaveBeenCalledWith('retrieval-quality', GROUPS_LIMIT);
  });

  test('narrows the rows by key, ignoring case, without a request', async () => {
    const user = userEvent.setup();
    await renderTab([
      groupMock({ group_key: 'sess_A' }),
      groupMock({ group_key: 'sess_B', last_activity_at: isoAgo(HOUR) }),
      groupMock({ group_key: 'other', dirty: false }),
    ]);

    await user.type(screen.getByLabelText(AnalyticsPipelinesI18nKey.GroupsSearch), 'SESS');

    expect(listedKeys()).toEqual(['sess_A', 'sess_B']);
    expect(getPipelineGroups).toHaveBeenCalledOnce();
  });

  test('narrows the rows by state', async () => {
    const user = userEvent.setup();
    await renderTab([groupMock({ group_key: 'sess_A' }), groupMock({ group_key: 'other', dirty: false })]);

    await user.click(screen.getByRole('combobox', { name: AnalyticsPipelinesI18nKey.GroupsStateFilter }));
    await user.click(screen.getByRole('option', { name: AnalyticsPipelinesI18nKey.GroupStateUpToDate }));

    expect(listedKeys()).toEqual(['other']);
  });

  test('says when the window is full', async () => {
    await renderTab(Array.from({ length: GROUPS_LIMIT }, (_, i) => groupMock({ group_key: `sess_${i}` })));

    expect(screen.getByText(AnalyticsPipelinesI18nKey.GroupsWindowFull)).toBeInTheDocument();
  });

  test('states a failed read in place of the grid and reads again', async () => {
    const user = userEvent.setup();
    getPipelineGroups.mockResolvedValue({ success: false, errorMessage: 'runner down' });
    render(<PipelineGroups pipeline={pipeline} isPaused={false} isGenerationBehind={false} />);

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.GroupsReadFailed, { exact: false })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'groups' })).toBeNull();

    await user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.GroupsReadAgain }));
    expect(getPipelineGroups).toHaveBeenCalledTimes(2);
  });

  test('queues a confirmed evaluation, announces it as queued and reads again', async () => {
    const user = userEvent.setup();
    queueGroupEvaluation.mockResolvedValue({ success: true });
    await renderTab([groupMock()]);

    await queueFirstGroup(user);

    expect(queueGroupEvaluation).toHaveBeenCalledWith('retrieval-quality', 'sess_A');
    expect(await screen.findByText(AnalyticsPipelinesI18nKey.GroupsQueued)).toBeInTheDocument();
    expect(getPipelineGroups).toHaveBeenCalledTimes(2);
  });

  test('reports a group the runner no longer tracks and reads again', async () => {
    const user = userEvent.setup();
    queueGroupEvaluation.mockResolvedValue({ success: false, errorHeader: 'not_found', status: 404 });
    await renderTab([groupMock()]);

    await queueFirstGroup(user);

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.GroupsQueueGone)).toBeInTheDocument();
    expect(getPipelineGroups).toHaveBeenCalledTimes(2);
  });

  test('reads again after a refusal and announces nothing as queued', async () => {
    const user = userEvent.setup();
    queueGroupEvaluation.mockResolvedValue({ success: false, status: 500, errorMessage: 'boom' });
    await renderTab([groupMock()]);

    await queueFirstGroup(user);

    await waitFor(() => expect(getPipelineGroups).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.GroupsQueued)).toBeNull();
  });
});
