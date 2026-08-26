import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getRules } from '@/src/app/[lang]/enrichment-rules/actions';
import { getEvaluator, getEvaluatorVersion, getEvaluators } from '@/src/app/[lang]/evaluators/actions';
import Page from '@/src/app/[lang]/evaluators/[name]/page';
import Page403 from '@/src/components/Page403/Page403';
import { Evaluator, EvaluatorType } from '@/src/models/analytics/evaluator';
import { EnrichmentRuleListItem, TriggerKind } from '@/src/models/analytics/rule';
import { isAnalyticsForbidden } from '@/src/server/analytics/analytics-access';

vi.mock('@/src/app/[lang]/enrichment-rules/actions');
vi.mock('@/src/app/[lang]/evaluators/actions');
vi.mock('@/src/server/analytics/analytics-access');
vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn(), errorLog: vi.fn() }));

const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
vi.mock('next/navigation', () => ({ notFound: () => notFound() }));

const latest: Evaluator = {
  name: 'conversation-insights',
  version: 4,
  type: EvaluatorType.Llm,
  created_at: '2026-08-19T10:00:00Z',
};

const pinnedVersion: Evaluator = { ...latest, version: 2 };

const rule: EnrichmentRuleListItem = {
  id: 'r_1',
  name: 'insights-live',
  evaluator_name: 'conversation-insights',
  evaluator_version: 2,
  evaluator: { name: 'conversation-insights', version: 2, type: EvaluatorType.Llm },
  target_enrichment: 'conversation_insights',
  grain_key: 'conversation_id',
  trigger_kind: TriggerKind.OnIngest,
  enabled: true,
  generation: 3,
  updated_at: '2026-08-21T09:37:29Z',
};

const renderPage = async (name = 'conversation-insights', version?: string) =>
  (await Page({
    params: Promise.resolve({ name }),
    searchParams: Promise.resolve({ version }),
  })) as { type: unknown; props: Record<string, unknown> };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isAnalyticsForbidden).mockResolvedValue(false);
  vi.mocked(getEvaluator).mockResolvedValue(latest);
  vi.mocked(getEvaluatorVersion).mockResolvedValue(pinnedVersion);
  vi.mocked(getEvaluators).mockResolvedValue([
    { name: 'conversation-insights', latest_version: 4, created_at: '2026-08-17T10:00:00Z' },
  ]);
  vi.mocked(getRules).mockResolvedValue([rule]);
});

describe('evaluator detail page — version addressing', () => {
  test('reads the latest version when no param is given', async () => {
    const page = await renderPage();

    expect(getEvaluator).toHaveBeenCalledWith('conversation-insights');
    expect(getEvaluatorVersion).not.toHaveBeenCalled();
    expect(page.props.evaluator).toEqual(latest);
  });

  test('reads the addressed version when the param is a positive integer', async () => {
    const page = await renderPage('conversation-insights', '2');

    expect(getEvaluatorVersion).toHaveBeenCalledWith('conversation-insights', 2);
    expect(getEvaluator).not.toHaveBeenCalled();
    expect(page.props.evaluator).toEqual(pinnedVersion);
  });

  test.each(['abc', '0', '-1', '2.5', ''])('falls back to the latest for a malformed param %s', async (raw) => {
    const page = await renderPage('conversation-insights', raw);

    expect(getEvaluator).toHaveBeenCalledOnce();
    expect(getEvaluatorVersion).not.toHaveBeenCalled();
    expect(page.props.evaluator).toEqual(latest);
  });

  test('looks up the name Next already decoded, without decoding it again', async () => {
    await renderPage('usage/client identity');

    expect(getEvaluator).toHaveBeenCalledWith('usage/client identity');
  });

  test('does not throw on a name containing a percent sign', async () => {
    await renderPage('pct%match');

    expect(getEvaluator).toHaveBeenCalledWith('pct%match');
  });

  test('is not found when the version read resolves to nothing', async () => {
    vi.mocked(getEvaluatorVersion).mockResolvedValue(null);

    await expect(renderPage('conversation-insights', '9')).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  test('is not found when the name is unknown', async () => {
    vi.mocked(getEvaluator).mockResolvedValue(null);

    await expect(renderPage('nope')).rejects.toThrow('NEXT_NOT_FOUND');
  });
});

describe('evaluator detail page — degraded reads', () => {
  test('hands the view the summary carrying the latest version and the name timestamp', async () => {
    const page = await renderPage();

    expect(page.props.summary).toMatchObject({ latest_version: 4, created_at: '2026-08-17T10:00:00Z' });
  });

  test('renders the version when the listing read fails', async () => {
    vi.mocked(getEvaluators).mockRejectedValue(new Error('boom'));

    const page = await renderPage();

    expect(page.props.evaluator).toEqual(latest);
    expect(page.props.summary).toBeNull();
  });

  test('reports no summary when the listing does not carry the name', async () => {
    vi.mocked(getEvaluators).mockResolvedValue([{ name: 'something-else', latest_version: 1 }]);

    const page = await renderPage();

    expect(page.props.summary).toBeNull();
  });

  test('hands the view the rules referencing this evaluator', async () => {
    const page = await renderPage();

    expect(getRules).toHaveBeenCalledOnce();
    expect(page.props.referencingRules).toEqual([rule]);
  });

  test('leaves the referencing rules null when the listing fails', async () => {
    vi.mocked(getRules).mockResolvedValue(null);

    const page = await renderPage();

    expect(page.props.referencingRules).toBeNull();
  });

  test('leaves the referencing rules null when the fetch throws', async () => {
    vi.mocked(getRules).mockRejectedValue(new Error('boom'));

    const page = await renderPage();

    expect(page.props.referencingRules).toBeNull();
  });
});

describe('evaluator detail page — access', () => {
  test('renders Page403 and fetches nothing for a forbidden caller', async () => {
    vi.mocked(isAnalyticsForbidden).mockResolvedValue(true);

    const page = await renderPage();

    expect(page.type).toBe(Page403);
    expect(getEvaluator).not.toHaveBeenCalled();
    expect(getEvaluatorVersion).not.toHaveBeenCalled();
    expect(getEvaluators).not.toHaveBeenCalled();
    expect(getRules).not.toHaveBeenCalled();
  });
});
