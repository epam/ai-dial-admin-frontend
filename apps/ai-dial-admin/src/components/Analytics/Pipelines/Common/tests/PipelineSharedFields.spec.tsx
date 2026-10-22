import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getTable, getTables } from '@/src/app/[lang]/pipelines/actions';
import PipelineSharedFields from '@/src/components/Analytics/Pipelines/Common/PipelineSharedFields';
import { usePipelineForm } from '@/src/components/Analytics/Pipelines/Common/use-pipeline-form';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { PipelineKind } from '@/src/models/analytics/pipeline';

vi.mock('@/src/app/[lang]/pipelines/actions');
vi.mock('@/src/app/[lang]/queries/actions');

const renderFields = async (props: { isFilterHidden?: boolean } = {}, filter = 'id > 0') => {
  const { result } = renderHook(() =>
    usePipelineForm({ initialDraft: { kind: PipelineKind.Aggregate, name: 'rollup', filter } }),
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

  test('opens an empty filter in the builder', async () => {
    await renderFields({}, '');

    expect(await screen.findByRole('button', { name: AnalyticsPipelinesI18nKey.FilterAddCondition })).toBeTruthy();
    expect(screen.queryByRole('textbox', { name: AnalyticsPipelinesI18nKey.Filter })).not.toBeInTheDocument();
  });

  test('keeps a written filter in the SQL view while no source is chosen', async () => {
    await renderFields();

    expect(await screen.findByText(AnalyticsPipelinesI18nKey.FilterUnavailableNoSource)).toBeTruthy();
  });

  test('is not offered when hidden', async () => {
    await renderFields({ isFilterHidden: true });

    expect(screen.queryByRole('textbox', { name: AnalyticsPipelinesI18nKey.Filter })).not.toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: AnalyticsPipelinesI18nKey.Filter })).not.toBeInTheDocument();
  });
});
