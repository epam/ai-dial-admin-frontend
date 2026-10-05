import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import PipelineRuntimeBadge from '@/src/components/Analytics/Pipelines/Common/PipelineRuntimeBadge';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { PipelineRuntimeStatus } from '@/src/models/analytics/pipeline-runtime';

describe('PipelineRuntimeBadge', () => {
  test('states each status the console can reach', () => {
    const cases: [PipelineRuntimeStatus, AnalyticsPipelinesI18nKey][] = [
      [PipelineRuntimeStatus.Running, AnalyticsPipelinesI18nKey.RuntimeRunning],
      [PipelineRuntimeStatus.Paused, AnalyticsPipelinesI18nKey.RuntimePaused],
      [PipelineRuntimeStatus.Held, AnalyticsPipelinesI18nKey.RuntimeHeld],
      [PipelineRuntimeStatus.OverBudget, AnalyticsPipelinesI18nKey.RuntimeOverBudget],
      [PipelineRuntimeStatus.Backpressured, AnalyticsPipelinesI18nKey.RuntimeBackpressured],
      [PipelineRuntimeStatus.NotTracked, AnalyticsPipelinesI18nKey.RuntimeNotTracked],
    ];

    cases.forEach(([status, label]) => {
      const { unmount } = render(<PipelineRuntimeBadge status={status} />);

      expect(screen.getByText(label)).toBeTruthy();
      unmount();
    });
  });

  // A disabled pipeline, an unread runner and a caller without the rights to ask are all cases where
  // the console has no answer, and an "unknown" chip would imply it looked.
  test('renders nothing when there is no answer to state', () => {
    const { container } = render(<PipelineRuntimeBadge status={PipelineRuntimeStatus.Unknown} />);

    expect(container.firstChild).toBeNull();
  });

  // Each of the three gates is a pipeline that is enabled, taken on and consuming nothing — which is
  // what a pause is, and is not a fault. Only the state where nothing drives the pipeline is an error.
  test('draws the gate states as a pause rather than as a fault', () => {
    const gates = [PipelineRuntimeStatus.Held, PipelineRuntimeStatus.OverBudget, PipelineRuntimeStatus.Backpressured];

    gates.forEach((status) => {
      const { container, unmount } = render(<PipelineRuntimeBadge status={status} />);

      expect((container.firstChild as HTMLElement).className).toContain('warning');
      unmount();
    });

    const { container } = render(<PipelineRuntimeBadge status={PipelineRuntimeStatus.NotTracked} />);

    expect((container.firstChild as HTMLElement).className).toContain('error');
  });
});
