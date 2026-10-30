import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { PASS_RATE_BAND_CLASS } from '@/src/components/Common/PassRateBar/constants';
import { PassRateBand } from '@/src/components/Common/PassRateBar/models';
import PassRateBar from '@/src/components/Common/PassRateBar/PassRateBar';

const renderBar = (rate: number) => render(<PassRateBar rate={rate} label="Completion Rate" />);

describe('PassRateBar', () => {
  test('exposes the rate as a named progress indicator', () => {
    renderBar(0.985);

    const bar = screen.getByRole('progressbar', { name: 'Completion Rate' });
    expect(bar.getAttribute('aria-valuenow')).toBe('98.5');
    expect(bar.getAttribute('aria-valuetext')).toBe('98.5%');
  });

  test('fills the bar to the rate', () => {
    renderBar(0.4);

    const fill = screen.getByRole('progressbar').firstElementChild as HTMLElement;
    expect(fill.style.width).toBe('40%');
  });

  test.each([
    [0.7, PassRateBand.High],
    [0.69, PassRateBand.Medium],
    [0.4, PassRateBand.Medium],
    [0.39, PassRateBand.Low],
  ])('colours a rate of %s with the %s band class', (rate, band) => {
    renderBar(rate);

    const fill = screen.getByRole('progressbar').firstElementChild as HTMLElement;
    expect(fill.className).toContain(PASS_RATE_BAND_CLASS[band]);
  });

  test('clamps rates outside 0–1', () => {
    renderBar(1.4);

    const bar = screen.getByRole('progressbar');
    expect((bar.firstElementChild as HTMLElement).style.width).toBe('100%');
    expect(bar.getAttribute('aria-valuenow')).toBe('100');
  });
});
