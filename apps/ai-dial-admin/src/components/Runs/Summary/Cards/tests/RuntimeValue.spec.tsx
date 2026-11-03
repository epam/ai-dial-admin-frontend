import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { RunsI18nKey } from '@/src/constants/i18n';
import RuntimeValue from '../RuntimeValue';

describe('RuntimeValue', () => {
  test('shows the total and both labelled parts', () => {
    render(<RuntimeValue sourceMs={341000} metricsMs={291000} sourceLabel="Model" />);

    expect(screen.getByText(`632${RunsI18nKey.Seconds}`)).toBeTruthy();
    expect(screen.getByText('Model:')).toBeTruthy();
    expect(screen.getByText(`341${RunsI18nKey.Seconds}`)).toBeTruthy();
    expect(screen.getByText(`291${RunsI18nKey.Seconds}`)).toBeTruthy();
  });

  test('dashes only the missing part and totals the other', () => {
    render(<RuntimeValue sourceMs={341000} metricsMs={null} sourceLabel="Model" />);

    expect(screen.getAllByText(`341${RunsI18nKey.Seconds}`)).toHaveLength(2);
    expect(screen.getAllByText('—')).toHaveLength(1);
  });

  test('shows a single dash and no breakdown when both parts are missing', () => {
    render(<RuntimeValue sourceMs={null} metricsMs={null} sourceLabel="Source" />);

    expect(screen.getAllByText('—')).toHaveLength(1);
    expect(screen.queryByText('Source:')).toBeNull();
  });

  test('keeps a zero part as a real value', () => {
    render(<RuntimeValue sourceMs={0} metricsMs={null} sourceLabel="Model" />);

    expect(screen.getAllByText(`0${RunsI18nKey.Seconds}`)).toHaveLength(2);
  });
});
