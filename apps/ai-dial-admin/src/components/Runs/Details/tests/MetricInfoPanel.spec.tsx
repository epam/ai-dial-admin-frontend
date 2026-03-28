import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import MetricInfoPanel from '../MetricInfoPanel';

const mockOpen = vi.fn();
vi.mock('../FullscreenViewer', () => ({
  useFullscreenViewer: () => ({ open: mockOpen, close: vi.fn() }),
}));

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: vi.fn() }),
}));

describe('MetricInfoPanel', () => {
  test('Should render flat info entries', () => {
    render(<MetricInfoPanel infos={{ reason: 'Low overlap' }} groupTitle="retrieval" />);

    expect(screen.getByText('reason')).toBeInTheDocument();
    expect(screen.getByText('Low overlap')).toBeInTheDocument();
  });

  test('Should flatten nested info objects into sub-entries', () => {
    const infos = {
      f1: { reason: 'Explanation text', confidence: 0.92 },
    };
    render(<MetricInfoPanel infos={infos} groupTitle="group" />);

    expect(screen.getByText('reason')).toBeInTheDocument();
    expect(screen.getByText('Explanation text')).toBeInTheDocument();
    expect(screen.getByText('confidence')).toBeInTheDocument();
  });

  test('Should show fullscreen button when value is large', () => {
    const infos = { verbose_logs: 'x'.repeat(300) };
    render(<MetricInfoPanel infos={infos} groupTitle="retrieval" />);

    expect(screen.getByText('Runs.OpenFullscreen')).toBeInTheDocument();
  });

  test('Should not show fullscreen button when values are short', () => {
    render(<MetricInfoPanel infos={{ reason: 'Short' }} groupTitle="retrieval" />);

    expect(screen.queryByText('Runs.OpenFullscreen')).not.toBeInTheDocument();
  });
});
