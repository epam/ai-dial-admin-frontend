import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

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

describe('FieldValue fitted variant', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderFitted = (raw = 'a long value') =>
    render(<FieldValue raw={raw} isScoreIndicator={false} failedLabel="Failed" isFitted />);

  test('does not scroll inside the cell like the fill variant does', () => {
    const { container } = renderFitted();

    expect(container.querySelector('.overflow-y-auto')).toBeNull();
  });

  test('shows the whole value, unclamped, until the cell has been measured', () => {
    renderFitted();

    expect(screen.getByText('a long value').style.getPropertyValue('-webkit-line-clamp')).toBe('');
  });

  test('clamps to the lines that fit once the cell has a height', () => {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100);
    renderFitted();

    const text = screen.getByText('a long value');
    expect(text.style.getPropertyValue('-webkit-line-clamp')).toBe('5');
    expect(text.style.overflow).toBe('hidden');
  });

  test('keeps the value text in the document so it stays readable to assistive technology', () => {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(40);
    renderFitted('a value that is clamped but still fully present in the DOM');

    expect(screen.getByText('a value that is clamped but still fully present in the DOM')).toBeInTheDocument();
  });

  test('still renders a score as a score instead of clamped text', () => {
    render(<FieldValue raw="0.8" isScoreIndicator failedLabel="Failed" isFitted />);

    expect(screen.getByText('0.800')).toHaveClass('bg-score-abs-09');
  });

  test('still shows the failed label for a failed metric', () => {
    render(<FieldValue raw={null} isFailed isScoreIndicator={false} failedLabel="Failed" isFitted />);

    expect(screen.getByText('Failed')).toHaveClass('text-error');
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
