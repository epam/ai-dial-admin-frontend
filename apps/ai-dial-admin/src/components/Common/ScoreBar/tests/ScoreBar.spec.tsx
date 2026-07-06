import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ScoreBar from '../ScoreBar';
import { getScoreIndicatorColor, getScoreIndicatorFillRatio, getScoreIndicatorStep } from '../utils';

describe('ScoreBar utils', () => {
  test('getScoreIndicatorStep floors to the lower bound of each 0.1 bucket', () => {
    expect(getScoreIndicatorStep(0)).toBe(0);
    expect(getScoreIndicatorStep(0.102)).toBe(0.1);
    expect(getScoreIndicatorStep(0.3)).toBe(0.3);
    expect(getScoreIndicatorStep(0.729)).toBe(0.7);
    expect(getScoreIndicatorStep(0.99)).toBe(0.9);
    expect(getScoreIndicatorStep(1)).toBe(1);
  });

  test('getScoreIndicatorColor returns Figma custom colors with inclusive lower bounds', () => {
    expect(getScoreIndicatorColor(0)).toBe('transparent');
    expect(getScoreIndicatorColor(0.05)).toBe('#f26b5b');
    expect(getScoreIndicatorColor(0.1)).toBe('#e5764a');
    expect(getScoreIndicatorColor(0.8)).toBe('#4ec5c5');
    expect(getScoreIndicatorColor(0.95)).toBe('#4dc87a');
    expect(getScoreIndicatorColor(1)).toBe('#30e070');
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
    expect(fill).toHaveStyle({ width: '50%', backgroundColor: '#b8c94a' });
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
