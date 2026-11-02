import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import FieldValue from '../FieldValue';

describe('FieldValue score indicator', () => {
  test('renders the score on its bucket color instead of a progress bar', () => {
    render(<FieldValue raw="0.8" isScoreIndicator failedLabel="Failed" />);

    expect(screen.getByText('0.800')).toHaveClass('bg-score-abs-09');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});

describe('FieldValue score fallbacks', () => {
  test('renders a non-numeric value of a score field as text', () => {
    render(<FieldValue raw="n/a" isScoreIndicator failedLabel="Failed" />);

    expect(screen.getByText('n/a').className).not.toMatch(/bg-score/);
  });
});

describe('FieldValue fill variant', () => {
  test('scrolls internally instead of expanding when content is long', () => {
    const { container } = render(<FieldValue raw="a long value" isScoreIndicator={false} failedLabel="Failed" fill />);

    expect(container.querySelector('.overflow-y-auto')).toBeTruthy();
  });
});

describe('FieldValue clamp', () => {
  test('clamps to four lines by default', () => {
    render(<FieldValue raw="a long value" isScoreIndicator={false} failedLabel="Failed" />);

    expect(screen.getByText('a long value')).toHaveClass('line-clamp-4');
  });

  test('applies the given clamp class instead of the default', () => {
    render(
      <FieldValue raw="a long value" isScoreIndicator={false} failedLabel="Failed" clampClassName="line-clamp-3" />,
    );

    const value = screen.getByText('a long value');
    expect(value).toHaveClass('line-clamp-3');
    expect(value).not.toHaveClass('line-clamp-4');
  });

  test('reports that a value which fits is not overflowing', () => {
    const onOverflowChange = vi.fn();
    render(
      <FieldValue raw="short" isScoreIndicator={false} failedLabel="Failed" onOverflowChange={onOverflowChange} />,
    );

    expect(onOverflowChange).toHaveBeenCalledWith(false);
  });
});
