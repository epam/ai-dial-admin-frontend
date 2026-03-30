import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import MetricInfoPanel from '../MetricInfoPanel';

const mockOpen = vi.fn();
vi.mock('@/src/components/Common/FullscreenViewer/FullscreenViewer', () => ({
  useFullscreenViewer: () => ({ open: mockOpen, close: vi.fn() }),
}));

describe('MetricInfoPanel', () => {
  test('Should render metric key header and entry titles', () => {
    const infos = {
      f1: { reason: 'Explanation text', confidence: '0.92' },
    };
    render(<MetricInfoPanel infos={infos} groupTitle="group" />);

    expect(screen.getByText('f1')).toBeInTheDocument();
    expect(screen.getByText('reason')).toBeInTheDocument();
    expect(screen.getByText('confidence')).toBeInTheDocument();
  });

  test('Should render entries as CodeViewer blocks', () => {
    const infos = { metric: { highlight: '{"corpus": [{"text": "test"}]}' } };
    render(<MetricInfoPanel infos={infos} groupTitle="retrieval" />);

    expect(screen.getByText('metric')).toBeInTheDocument();
    expect(screen.getByText('highlight')).toBeInTheDocument();
  });

  test('Should render multiple metric groups', () => {
    const infos = {
      context_to_answer: { reason: 'Good coverage' },
      answer_to_ground_truth: { reason: 'Partial match' },
    };
    render(<MetricInfoPanel infos={infos} groupTitle="generation" />);

    expect(screen.getByText('context_to_answer')).toBeInTheDocument();
    expect(screen.getByText('answer_to_ground_truth')).toBeInTheDocument();
  });
});
