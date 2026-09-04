import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getPipelines } from '@/src/app/[lang]/pipelines/actions';
import { getEvaluators } from '@/src/app/[lang]/evaluators/actions';
import PipelinesView from '@/src/components/Analytics/Pipelines/PipelinesView';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { EvaluatorType } from '@/src/models/analytics/evaluator';
import { PipelineListItem, TriggerKind, PipelineKind } from '@/src/models/analytics/pipeline';

vi.mock('@/src/app/[lang]/pipelines/actions');
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

const rule: PipelineListItem = {
  name: 'turn-feedback-live',
  kind: PipelineKind.Enrich,
  evaluator_name: 'feedback-rollup',
  evaluator_version: 2,
  evaluator: { name: 'feedback-rollup', version: 2, type: EvaluatorType.Sql },
  target: 'turn_feedback',
  grain_key: 'response_id',
  trigger: { kind: TriggerKind.OnIngest },
  enabled: true,
  generation: 5,
  updated_at: '2026-08-21T09:37:29Z',
};

describe('PipelinesView — permissions', () => {
  beforeEach(() => {
    vi.mocked(getEvaluators).mockResolvedValue([{ name: 'feedback-rollup', latest_version: 2 }]);
    vi.mocked(getPipelines).mockResolvedValue({ data: [rule], isForbidden: false });
  });

  test('offers no create action to a caller who is not a full admin', async () => {
    isFullAdmin.value = false;
    render(<PipelinesView initialPipelines={[rule]} />);

    await waitFor(() => expect(getEvaluators).toHaveBeenCalled());
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.CreatePipeline)).toBeNull();
  });

  test('hides the delete row action from a caller who is not a full admin', () => {
    isFullAdmin.value = false;
    render(<PipelinesView initialPipelines={[rule]} />);

    expect(screen.getByText('hidden actions: true')).toBeTruthy();
  });

  test('offers both to a full admin', async () => {
    isFullAdmin.value = true;
    render(<PipelinesView initialPipelines={[rule]} />);

    await waitFor(() => expect(screen.getByText(AnalyticsPipelinesI18nKey.CreatePipeline)).toBeTruthy());
    expect(screen.getByText('hidden actions: false')).toBeTruthy();
  });
});
