import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getRules } from '@/src/app/[lang]/enrichment-rules/actions';
import { getEvaluators } from '@/src/app/[lang]/evaluators/actions';
import EnrichmentRulesView from '@/src/components/Analytics/EnrichmentRules/EnrichmentRulesView';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { AnalyticsEnrichmentRulesI18nKey } from '@/src/constants/i18n';
import { EvaluatorType } from '@/src/models/analytics/evaluator';
import { EnrichmentRuleListItem, TriggerKind } from '@/src/models/analytics/rule';

vi.mock('@/src/app/[lang]/enrichment-rules/actions');
vi.mock('@/src/app/[lang]/evaluators/actions');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

// test-setup.tsx pins isFullAdmin true for the whole suite, so the non-admin case needs its own file.
const isFullAdmin = { value: false };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ isFullAdmin: isFullAdmin.value, isEnableAuth: true, featureFlags: {} }),
}));

interface MockActionItem {
  id: string;
  hidden?: () => boolean;
}

interface MockColDef {
  field?: string;
  cellRendererParams?: { items?: MockActionItem[] };
}

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ columnDefs }: { columnDefs?: MockColDef[] }) => {
    const items = columnDefs?.find((c) => c.field === ACTIONS_COLUMN_CEL_ID)?.cellRendererParams?.items ?? [];
    return <div>hidden actions: {items.map((item) => String(item.hidden?.())).join('|')}</div>;
  },
}));

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

describe('EnrichmentRulesView — permissions', () => {
  beforeEach(() => {
    vi.mocked(getEvaluators).mockResolvedValue([{ name: 'feedback-rollup', latest_version: 2 }]);
    vi.mocked(getRules).mockResolvedValue([rule]);
  });

  test('offers no create action to a caller who is not a full admin', async () => {
    isFullAdmin.value = false;
    render(<EnrichmentRulesView initialRules={[rule]} />);

    await waitFor(() => expect(getEvaluators).toHaveBeenCalled());
    expect(screen.queryByText(AnalyticsEnrichmentRulesI18nKey.CreateRule)).toBeNull();
  });

  test('hides the delete row action from a caller who is not a full admin', () => {
    isFullAdmin.value = false;
    render(<EnrichmentRulesView initialRules={[rule]} />);

    expect(screen.getByText('hidden actions: true')).toBeTruthy();
  });

  test('offers both to a full admin', async () => {
    isFullAdmin.value = true;
    render(<EnrichmentRulesView initialRules={[rule]} />);

    await waitFor(() => expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.CreateRule)).toBeTruthy());
    expect(screen.getByText('hidden actions: false')).toBeTruthy();
  });
});
