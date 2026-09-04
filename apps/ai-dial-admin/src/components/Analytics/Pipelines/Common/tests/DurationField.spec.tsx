import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import DurationField from '@/src/components/Analytics/Pipelines/Common/DurationField';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';

describe('DurationField', () => {
  const renderField = (props?: Partial<Parameters<typeof DurationField>[0]>) =>
    render(<DurationField id="idle" label="Idle for" value="" onChange={vi.fn()} {...props} />);

  test('renders an amount input paired with a unit select', () => {
    renderField();

    expect(screen.getByRole('spinbutton')).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.UnitMinutes)).toBeTruthy();
  });

  test('shows the amount and unit of a short-form value', () => {
    renderField({ value: '2h' });

    expect(screen.getByRole('spinbutton')).toHaveValue(2);
    expect(screen.getByText(AnalyticsPipelinesI18nKey.UnitHours)).toBeTruthy();
  });

  test('shows an ISO-8601 value through the same paired control', () => {
    renderField({ value: 'PT10M' });

    expect(screen.getByRole('spinbutton')).toHaveValue(10);
    expect(screen.getByText(AnalyticsPipelinesI18nKey.UnitMinutes)).toBeTruthy();
  });

  test('emits the short form when the amount is typed', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField({ onChange });

    await user.type(screen.getByRole('spinbutton'), '5');

    expect(onChange).toHaveBeenCalledWith('5m');
  });

  test('emits the short form when the unit is changed', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField({ value: '10m', onChange });

    await user.click(screen.getByText(AnalyticsPipelinesI18nKey.UnitMinutes));
    await user.click(screen.getByText(AnalyticsPipelinesI18nKey.UnitHours));

    expect(onChange).toHaveBeenCalledWith('10h');
  });

  test('clears the value when the amount is emptied', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField({ value: '10m', onChange });

    await user.clear(screen.getByRole('spinbutton'));

    expect(onChange).toHaveBeenCalledWith('');
  });

  test('falls back to a raw input for an unrecognised value', () => {
    renderField({ value: 'PT1H30M' });

    expect(screen.queryByRole('spinbutton')).toBeNull();
    expect(screen.getByDisplayValue('PT1H30M')).toBeTruthy();
  });

  test('keeps editing an unrecognised value verbatim', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField({ value: 'whenever', onChange });

    await user.type(screen.getByDisplayValue('whenever'), '!');

    expect(onChange).toHaveBeenCalledWith('whenever!');
  });
});
