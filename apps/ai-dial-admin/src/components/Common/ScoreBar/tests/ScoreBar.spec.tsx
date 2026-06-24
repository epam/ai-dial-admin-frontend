import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ScoreBar from '../ScoreBar';
import { getScoreIndicatorColor, getScoreIndicatorFillRatio, getScoreIndicatorStep } from '../utils';

describe('ScoreBar utils', () => {
  test('getScoreIndicatorStep rounds up to nearest 0.1 for color bucket', () => {
    expect(getScoreIndicatorStep(0)).toBe(0);
    expect(getScoreIndicatorStep(0.102)).toBe(0.2);
    expect(getScoreIndicatorStep(0.729)).toBe(0.8);
    expect(getScoreIndicatorStep(1)).toBe(1);
  });

  test('getScoreIndicatorColor returns Figma custom colors', () => {
    expect(getScoreIndicatorColor(0.1)).toBe('#f26b5b');
    expect(getScoreIndicatorColor(0.8)).toBe('#4ecba8');
    expect(getScoreIndicatorColor(1)).toBe('#4dc87a');
  });

  test('getScoreIndicatorFillRatio clamps to 0–1', () => {
    expect(getScoreIndicatorFillRatio(-0.5)).toBe(0);
    expect(getScoreIndicatorFillRatio(0.303)).toBe(0.303);
    expect(getScoreIndicatorFillRatio(1.5)).toBe(1);
  });
});

describe('ScoreBar', () => {
  test('renders fill bar for score value', () => {
    const { container } = render(<ScoreBar value={0.5} />);
    const fill = container.querySelector('.h-full.rounded-sm');
    expect(fill).toBeInTheDocument();
    expect(fill).toHaveStyle({ width: '50%', backgroundColor: '#d4be3a' });
  });

  test('renders empty track for zero score', () => {
    const { container } = render(<ScoreBar value={0} />);
    expect(container.querySelector('.h-full.rounded-sm')).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-layer-1');
  });

  test('applies custom width', () => {
    const { container } = render(<ScoreBar value={0.5} width={49} />);
    expect(container.firstChild).toHaveStyle({ width: '49px' });
  });
});
