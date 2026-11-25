import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import HighlightedText from '../HighlightedText';
import { MetricHighlight } from '../models';

const highlight = (overrides: Partial<MetricHighlight> = {}): MetricHighlight => ({
  sources: [
    {
      key: 'corpus',
      chunks: [
        { text: 'good', score: 1, title: '1.0' },
        { text: '\n', score: 0 },
        { text: 'bad', score: -1 },
        { text: ' neutral', score: 0 },
      ],
    },
  ],
  ...overrides,
});

describe('HighlightedText', () => {
  test('colors positive and negative chunks and leaves neutral text unstyled', () => {
    render(<HighlightedText highlight={highlight()} />);

    expect(screen.getByText('good')).toHaveClass('bg-score-delta-p4');
    expect(screen.getByText('bad')).toHaveClass('bg-score-delta-n4');
    expect(screen.getByText('neutral', { exact: false }).className).not.toMatch(/bg-score/);
  });

  test('preserves newlines between chunks', () => {
    const { container } = render(<HighlightedText highlight={highlight()} />);

    expect(container.querySelector('p')).toHaveClass('whitespace-pre-wrap');
    expect(container.textContent).toContain('\n');
  });

  test('shows a source key as a secondary label', () => {
    render(<HighlightedText highlight={highlight()} />);

    expect(screen.getByText('corpus')).toHaveClass('text-secondary');
  });

  test('exposes the chunk title as a tooltip and an aria-label score for colored chunks', () => {
    render(<HighlightedText highlight={highlight()} />);

    const good = screen.getByText('good');
    expect(good).toHaveAttribute('title', '1.0');
    expect(good).toHaveAttribute('aria-label', 'good (score 1)');
    expect(screen.getByText('neutral', { exact: false })).not.toHaveAttribute('aria-label');
  });

  test('omits the source label for a bare array', () => {
    render(
      <HighlightedText
        highlight={{
          sources: [{ key: null, chunks: [{ text: 'only', score: 0 }] }],
        }}
      />,
    );

    expect(screen.getByText('only')).toBeInTheDocument();
    expect(screen.queryByText('corpus')).toBeNull();
  });
});
