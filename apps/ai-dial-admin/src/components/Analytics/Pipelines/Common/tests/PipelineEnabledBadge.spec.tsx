import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import PipelineEnabledBadge from '@/src/components/Analytics/Pipelines/Common/PipelineEnabledBadge';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';

describe('PipelineEnabledBadge', () => {
  test('states whether the pipeline is enabled', () => {
    const { unmount } = render(<PipelineEnabledBadge enabled />);
    expect(screen.getByText(AnalyticsPipelinesI18nKey.StatusEnabled)).toBeTruthy();
    unmount();

    render(<PipelineEnabledBadge enabled={false} />);
    expect(screen.getByText(AnalyticsPipelinesI18nKey.StatusDisabled)).toBeTruthy();
  });

  test('renders nothing when the flag is unknown', () => {
    const { container } = render(<PipelineEnabledBadge />);

    expect(container.firstChild).toBeNull();
  });

  test('sizes to its label rather than to its container', () => {
    render(<PipelineEnabledBadge enabled />);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.StatusEnabled).className).toContain('w-fit');
  });
});
