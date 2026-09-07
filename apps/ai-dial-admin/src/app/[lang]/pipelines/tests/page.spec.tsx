import { beforeEach, describe, expect, test, vi } from 'vitest';

import Page from '@/src/app/[lang]/pipelines/page';
import { getPipelines } from '@/src/app/[lang]/pipelines/actions';
import { getFunctions } from '@/src/app/[lang]/queries/actions';
import Page403 from '@/src/components/Page403/Page403';
import { PipelineKind, PipelineListItem, TriggerKind } from '@/src/models/analytics/pipeline';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';

vi.mock('@/src/app/[lang]/pipelines/actions');
vi.mock('@/src/app/[lang]/queries/actions');
vi.mock('@/src/server/analytics/analytics-access');
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

const pipeline: PipelineListItem = {
  name: 'turn-feedback-live',
  kind: PipelineKind.Enrich,
  target: 'turn_feedback',
  trigger: { kind: TriggerKind.OnIngest },
  enabled: true,
  generation: 5,
  updated_at: '2026-08-21T09:37:29Z',
};

const renderPage = async () => (await Page()) as { type: unknown; props: Record<string, unknown> };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isAnalyticsForbidden).mockResolvedValue(false);
  vi.mocked(getFunctions).mockResolvedValue([]);
  vi.mocked(getPipelines).mockResolvedValue({ data: [pipeline], isForbidden: false });
});

describe('pipelines page', () => {
  test('seeds the listing from an unfiltered read', async () => {
    const page = await renderPage();

    expect(getPipelines).toHaveBeenCalledWith();
    expect(page.props).toMatchObject({ initialPipelines: [pipeline], hasLoadError: false });
  });

  test('renders the forbidden page without reading anything when the section is closed', async () => {
    vi.mocked(isAnalyticsForbidden).mockResolvedValue(true);

    const page = await renderPage();

    expect(page.type).toBe(Page403);
    expect(getPipelines).not.toHaveBeenCalled();
  });

  // The section guard admits a caller the registry itself may still refuse, and reporting that refusal as
  // "could not be loaded" names a cause that is not the cause.
  test('renders the forbidden page when the registry refuses the read', async () => {
    vi.mocked(getPipelines).mockResolvedValue({ data: null, isForbidden: true });

    const page = await renderPage();

    expect(page.type).toBe(Page403);
  });

  test('states a load failure rather than a refusal when the read merely fails', async () => {
    vi.mocked(getPipelines).mockResolvedValue({ data: null, isForbidden: false });

    const page = await renderPage();

    expect(page.type).not.toBe(Page403);
    expect(page.props).toMatchObject({ initialPipelines: [], hasLoadError: true });
  });

  test('states a load failure when the read throws', async () => {
    vi.mocked(getPipelines).mockRejectedValue(new Error('boom'));

    const page = await renderPage();

    expect(page.props).toMatchObject({ hasLoadError: true });
  });

  // The measure editor reads its offered functions from the served catalog, and a failed catalog read
  // degrades that control rather than the page.
  test('hands the served function catalog to the view', async () => {
    vi.mocked(getFunctions).mockRejectedValue(new Error('boom'));

    const page = await renderPage();

    expect(page.props).toMatchObject({ functions: [] });
  });
});
