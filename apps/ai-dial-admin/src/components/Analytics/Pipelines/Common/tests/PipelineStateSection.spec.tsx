import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import PipelineStateSection from '@/src/components/Analytics/Pipelines/Common/PipelineStateSection';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { PipelineState } from '@/src/models/analytics/pipeline';

const renderState = (state?: PipelineState) => render(<PipelineStateSection state={state} />);

describe('Pipelines :: PipelineStateSection', () => {
  test('renders nothing when the service reports no state', () => {
    const { container } = renderState();

    expect(container).toBeEmptyDOMElement();
  });

  test('presents the execution position', () => {
    renderState({ last_run_at: '2026-09-04T08:48:03Z', next_run_at: '2026-09-04T09:03:00Z', lag_seconds: 331 });

    expect(screen.getByText(AnalyticsPipelinesI18nKey.LastRun)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.NextRun)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.LagSeconds)).toBeInTheDocument();
  });

  test('presents an absent member as absent rather than as a zero', () => {
    renderState({ unclamped_reads: [] });

    expect(screen.getAllByText(AnalyticsPipelinesI18nKey.NotSet).length).toBeGreaterThan(0);
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.BacklogNo)).not.toBeInTheDocument();
  });

  test('distinguishes a caught-up pipeline from one working through a backlog', () => {
    const { rerender } = renderState({ has_more: false });
    expect(screen.getByText(AnalyticsPipelinesI18nKey.BacklogNo)).toBeInTheDocument();

    rerender(<PipelineStateSection state={{ has_more: true }} />);
    expect(screen.getByText(AnalyticsPipelinesI18nKey.BacklogYes)).toBeInTheDocument();
  });

  test('surfaces the last failure as the service worded it', () => {
    renderState({ last_error: 'ClickHouse read timed out' });

    expect(screen.getByText('ClickHouse read timed out')).toBeInTheDocument();
  });

  test('names the enrichment holding a clamped window', () => {
    renderState({ clamp: { enrichment: 'usage_client_identity' } });

    expect(screen.getByText(AnalyticsPipelinesI18nKey.ClampedBy)).toBeInTheDocument();
  });

  test('states that a rebuild is required and names the enrichment', () => {
    renderState({ rebuild_required: { enrichment: 'usage_client_identity', rederived_at: '2026-09-04T08:23:34Z' } });

    expect(screen.getByText(AnalyticsPipelinesI18nKey.RebuildRequired)).toBeInTheDocument();
  });

  test('lists each unclamped read with its reason', () => {
    renderState({
      unclamped_reads: [
        { enrichment: 'a', reason: 'no grain join' },
        { enrichment: 'b', reason: 'no grain join' },
      ],
    });

    expect(screen.getAllByText(AnalyticsPipelinesI18nKey.UnclampedRead)).toHaveLength(2);
  });
});
