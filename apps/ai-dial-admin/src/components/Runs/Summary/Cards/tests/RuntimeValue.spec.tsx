import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import RuntimeValue from '../RuntimeValue';

describe('RuntimeValue', () => {
  test('shows the total and both labelled parts', () => {
    render(<RuntimeValue sourceMs={341000} metricsMs={291000} sourceLabel="Model" />);

    expect(screen.getByText('10m 32s')).toBeTruthy();
    expect(screen.getByText('Model:')).toBeTruthy();
    expect(screen.getByText('5m 41s')).toBeTruthy();
    expect(screen.getByText('4m 51s')).toBeTruthy();
  });

  test('dashes only the missing part and totals the other', () => {
    render(<RuntimeValue sourceMs={341000} metricsMs={null} sourceLabel="Model" />);

    expect(screen.getAllByText('5m 41s')).toHaveLength(2);
    expect(screen.getAllByText('—')).toHaveLength(1);
  });

  test('shows a single dash and no breakdown when both parts are missing', () => {
    render(<RuntimeValue sourceMs={null} metricsMs={null} sourceLabel="Source" />);

    expect(screen.getAllByText('—')).toHaveLength(1);
    expect(screen.queryByText('Source:')).toBeNull();
  });

  test('keeps a zero part as a real value', () => {
    render(<RuntimeValue sourceMs={0} metricsMs={null} sourceLabel="Model" />);

    expect(screen.getAllByText('0s')).toHaveLength(2);
  });

  test('scales long runtimes to minutes and hours', () => {
    render(<RuntimeValue sourceMs={2002600} metricsMs={74700} sourceLabel="Application" />);

    expect(screen.getByText('34m 37s')).toBeTruthy();
    expect(screen.getByText('33m 23s')).toBeTruthy();
    expect(screen.getByText('1m 15s')).toBeTruthy();
  });

  test('uses hours once the total passes an hour', () => {
    render(<RuntimeValue sourceMs={3_900_000} metricsMs={300_000} sourceLabel="Model" />);

    expect(screen.getByText('1h 10m')).toBeTruthy();
    expect(screen.getByText('1h 5m')).toBeTruthy();
    expect(screen.getByText('5m 0s')).toBeTruthy();
  });
});
