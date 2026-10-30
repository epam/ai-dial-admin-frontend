import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import PassRateValue from '../PassRateValue';

const renderValue = (props: Partial<React.ComponentProps<typeof PassRateValue>> = {}) =>
  render(<PassRateValue rate={0.985} label="Threshold Pass Rate" {...props} />);

describe('PassRateValue', () => {
  test('shows the percentage and a named progress bar', () => {
    renderValue();

    expect(screen.getByText('98.5%')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'Threshold Pass Rate' })).toBeTruthy();
  });

  test('shows the threshold line only when a threshold is set', () => {
    renderValue({ threshold: 0.6 });

    expect(screen.getByText(TestSuitesI18nKey.TrendsThresholdLabel)).toBeTruthy();
    expect(screen.getByText('0.6')).toBeTruthy();
  });

  test('omits the threshold line without a threshold', () => {
    renderValue({ threshold: null });

    expect(screen.queryByText(TestSuitesI18nKey.TrendsThresholdLabel)).toBeNull();
  });

  test('shows a threshold of zero rather than treating it as unset', () => {
    renderValue({ threshold: 0 });

    expect(screen.getByText('0')).toBeTruthy();
  });

  test('shows a dash and no bar when the run has no test cases', () => {
    renderValue({ rate: null, threshold: 0.6 });

    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryByText(TestSuitesI18nKey.TrendsThresholdLabel)).toBeNull();
  });
});
