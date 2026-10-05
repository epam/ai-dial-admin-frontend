import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Page from '@/src/app/[lang]/pipelines/[name]/page';
import { getPipeline, getPipelineGroups, getPipelines } from '@/src/app/[lang]/pipelines/actions';
import { getFunctions } from '@/src/app/[lang]/queries/actions';
import { Pipeline, PipelineKind, TriggerKind } from '@/src/models/analytics/pipeline';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';
import { isFullAdminCaller } from '@/src/server/user-access';
import { groupMock } from '@/src/components/Analytics/Pipelines/Groups/tests/mock';

vi.mock('next/navigation', () => ({ notFound: vi.fn() }));
vi.mock('@/src/app/[lang]/pipelines/actions');
vi.mock('@/src/app/[lang]/queries/actions');
vi.mock('@/src/server/analytics/analytics-access');
vi.mock('@/src/server/user-access');
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

const groupPipeline = {
  name: 'retrieval-quality',
  kind: PipelineKind.Enrich,
  target: 'retrieval_quality',
  trigger: { kind: TriggerKind.Group, group_by: 'session_id', ready_when: { idle: '10m' } },
  enabled: true,
  generation: 3,
} as Pipeline;

interface Element {
  props: { children: { props: Record<string, unknown> } };
}

const renderPage = async () => {
  const page = (await Page({ params: Promise.resolve({ name: groupPipeline.name }) })) as unknown as Element;
  return page.props.children.props;
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('ANALYTICS_ENABLED', 'true');
  vi.mocked(isAnalyticsForbidden).mockResolvedValue(false);
  vi.mocked(isFullAdminCaller).mockResolvedValue(true);
  vi.mocked(getFunctions).mockResolvedValue([]);
  vi.mocked(getPipelines).mockResolvedValue({ success: true, response: [] });
  vi.mocked(getPipeline).mockResolvedValue({ success: true, response: groupPipeline });
  vi.mocked(getPipelineGroups).mockResolvedValue({ success: true, response: [] });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('pipeline detail page :: groups probe', () => {
  test('offers the tab when the runner reports a group', async () => {
    vi.mocked(getPipelineGroups).mockResolvedValue({
      success: true,
      response: [groupMock()],
    });

    const props = await renderPage();

    expect(getPipelineGroups).toHaveBeenCalledWith('retrieval-quality', 1);
    expect(props.hasGroups).toBe(true);
  });

  test('withholds the tab when the runner reports no group', async () => {
    expect((await renderPage()).hasGroups).toBe(false);
  });

  test('withholds the tab silently when the read fails', async () => {
    vi.mocked(getPipelineGroups).mockResolvedValue({ success: false, status: 503 });

    expect((await renderPage()).hasGroups).toBe(false);
  });

  test('withholds the tab when the read throws', async () => {
    vi.mocked(getPipelineGroups).mockRejectedValue(new Error('down'));

    expect((await renderPage()).hasGroups).toBe(false);
  });

  test('never probes a pipeline whose trigger is not a group', async () => {
    vi.mocked(getPipeline).mockResolvedValue({
      success: true,
      response: { ...groupPipeline, trigger: { kind: TriggerKind.OnIngest } },
    });

    expect((await renderPage()).hasGroups).toBe(false);
    expect(getPipelineGroups).not.toHaveBeenCalled();
  });

  test('never probes for a caller who is not a full admin', async () => {
    vi.mocked(isFullAdminCaller).mockResolvedValue(false);

    expect((await renderPage()).hasGroups).toBe(false);
    expect(getPipelineGroups).not.toHaveBeenCalled();
  });

  test('never probes with analytics disabled', async () => {
    vi.stubEnv('ANALYTICS_ENABLED', 'false');

    expect((await renderPage()).hasGroups).toBe(false);
    expect(isFullAdminCaller).not.toHaveBeenCalled();
    expect(getPipelineGroups).not.toHaveBeenCalled();
  });
});
