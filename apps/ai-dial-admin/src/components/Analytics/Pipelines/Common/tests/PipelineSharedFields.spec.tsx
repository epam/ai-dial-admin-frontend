import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getTable, getTables } from '@/src/app/[lang]/pipelines/actions';
import PipelineSharedFields from '@/src/components/Analytics/Pipelines/Common/PipelineSharedFields';
import { usePipelineForm } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-form';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { PipelineKind } from '@/src/models/analytics/pipeline';

vi.mock('@/src/app/[lang]/pipelines/actions');

const renderFields = async (props: { isFilterHidden?: boolean } = {}) => {
  const { result } = renderHook(() =>
    usePipelineForm({ initialDraft: { kind: PipelineKind.Aggregate, name: 'rollup', filter: 'id > 0' } }),
  );
  await waitFor(() => expect(result.current.isTablesLoading).toBe(false));
  render(<PipelineSharedFields form={result.current} {...props} />);
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getTables).mockResolvedValue([]);
  vi.mocked(getTable).mockResolvedValue(null);
});

describe('PipelineSharedFields — the filter', () => {
  test('is offered by default', async () => {
    await renderFields();

    expect(screen.getByRole('textbox', { name: AnalyticsPipelinesI18nKey.Filter })).toHaveValue('id > 0');
  });

  test('is not offered when hidden', async () => {
    await renderFields({ isFilterHidden: true });

    expect(screen.queryByRole('textbox', { name: AnalyticsPipelinesI18nKey.Filter })).not.toBeInTheDocument();
  });
});
