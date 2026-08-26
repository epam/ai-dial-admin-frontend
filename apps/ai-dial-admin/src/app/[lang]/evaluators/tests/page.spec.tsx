import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getRules } from '@/src/app/[lang]/enrichment-rules/actions';
import { getEvaluators } from '@/src/app/[lang]/evaluators/actions';
import Page from '@/src/app/[lang]/evaluators/page';
import Page403 from '@/src/components/Page403/Page403';
import { EvaluatorType } from '@/src/models/analytics/evaluator';
import { EnrichmentRuleListItem, TriggerKind } from '@/src/models/analytics/rule';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';

vi.mock('@/src/app/[lang]/enrichment-rules/actions');
vi.mock('@/src/app/[lang]/evaluators/actions');
vi.mock('@/src/server/analytics/analytics-access');
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

const rule: EnrichmentRuleListItem = {
  id: 'r_1',
  name: 'turn-feedback-live',
  evaluator_name: 'feedback-rollup',
  evaluator_version: 2,
  evaluator: { name: 'feedback-rollup', version: 2, type: EvaluatorType.Sql },
  target_enrichment: 'turn_feedback',
  grain_key: 'response_id',
  trigger_kind: TriggerKind.OnIngest,
  enabled: true,
  generation: 5,
  updated_at: '2026-08-21T09:37:29Z',
};

const evaluators = [{ name: 'feedback-rollup', latest_version: 2, created_at: '2026-08-17T10:00:00Z' }];

const renderPage = async () => (await Page()) as { type: unknown; props: Record<string, unknown> };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isAnalyticsForbidden).mockResolvedValue(false);
  vi.mocked(getEvaluators).mockResolvedValue(evaluators);
  vi.mocked(getRules).mockResolvedValue([rule]);
});

describe('evaluators page', () => {
  test('prefetches the evaluators and hands their rows to the view', async () => {
    const page = await renderPage();

    expect(getEvaluators).toHaveBeenCalledOnce();
    expect(page.props).toMatchObject({ hasLoadError: false, hasUsageError: false });
    expect(page.props.rows).toEqual([
      { name: 'feedback-rollup', latest_version: 2, created_at: '2026-08-17T10:00:00Z', usedBy: 1 },
    ]);
  });

  test('joins the usage from a single rules listing', async () => {
    await renderPage();

    expect(getRules).toHaveBeenCalledOnce();
  });

  test('renders the console with a stated failure when the evaluators listing fails', async () => {
    vi.mocked(getEvaluators).mockResolvedValue(null);

    const page = await renderPage();

    expect(page.props).toMatchObject({ rows: [], hasLoadError: true });
    expect(page.type).not.toBe(Page403);
  });

  test('reports a thrown evaluators fetch the same way', async () => {
    vi.mocked(getEvaluators).mockRejectedValue(new Error('boom'));

    const page = await renderPage();

    expect(page.props).toMatchObject({ rows: [], hasLoadError: true });
  });

  test('reports the usage as unknown, not zero, when the rules listing fails', async () => {
    vi.mocked(getRules).mockResolvedValue(null);

    const page = await renderPage();

    expect(page.props).toMatchObject({ hasUsageError: true, hasLoadError: false });
    expect((page.props.rows as { usedBy: number | null }[])[0].usedBy).toBeNull();
  });

  test('reports the usage as unknown when the rules fetch throws', async () => {
    vi.mocked(getRules).mockRejectedValue(new Error('boom'));

    const page = await renderPage();

    expect(page.props).toMatchObject({ hasUsageError: true });
    expect((page.props.rows as { usedBy: number | null }[])[0].usedBy).toBeNull();
  });

  test('reports zero for an evaluator no rule names', async () => {
    vi.mocked(getEvaluators).mockResolvedValue([{ name: 'conversation-insights', latest_version: 4 }]);

    const page = await renderPage();

    expect((page.props.rows as { usedBy: number | null }[])[0].usedBy).toBe(0);
  });

  test('renders Page403 and fetches nothing for a forbidden caller', async () => {
    vi.mocked(isAnalyticsForbidden).mockResolvedValue(true);

    const page = await renderPage();

    expect(page.type).toBe(Page403);
    expect(getEvaluators).not.toHaveBeenCalled();
    expect(getRules).not.toHaveBeenCalled();
  });
});
