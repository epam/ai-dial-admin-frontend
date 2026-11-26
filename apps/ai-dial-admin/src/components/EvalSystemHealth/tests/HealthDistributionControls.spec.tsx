import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HealthDistributionControls from '@/src/components/EvalSystemHealth/HealthDistributionControls';
import { HealthDistributionControlsProps } from '@/src/components/EvalSystemHealth/models';
import { ButtonsI18nKey, EvalSystemHealthI18nKey } from '@/src/constants/i18n';

const onWeeksChange = vi.fn();
const onThresholdPercentChange = vi.fn();
const onReset = vi.fn();

const renderControls = (overrides: Partial<HealthDistributionControlsProps> = {}) =>
  render(
    <HealthDistributionControls
      weeks={5}
      thresholdPercent={75}
      isModified={false}
      onWeeksChange={onWeeksChange}
      onThresholdPercentChange={onThresholdPercentChange}
      onReset={onReset}
      {...overrides}
    />,
  );

const getThresholdInput = () =>
  screen.getByRole('spinbutton', { name: EvalSystemHealthI18nKey.HealthDistributionThresholdLabel });

describe('HealthDistributionControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('names the group and labels both controls with the applied values', () => {
    renderControls({ weeks: 8, thresholdPercent: 90 });

    expect(screen.getByRole('group', { name: EvalSystemHealthI18nKey.HealthDistributionControlsLabel })).toBeTruthy();
    expect(
      screen.getByRole('combobox', { name: `${EvalSystemHealthI18nKey.HealthDistributionWeeksLabel}, 8` }),
    ).toBeTruthy();
    expect(getThresholdInput()).toHaveValue(90);
  });

  test('applies the weeks as soon as an option is picked', async () => {
    const user = userEvent.setup();
    renderControls();

    await user.click(
      screen.getByRole('combobox', { name: `${EvalSystemHealthI18nKey.HealthDistributionWeeksLabel}, 5` }),
    );
    await user.click(screen.getByRole('option', { name: '12' }));

    expect(onWeeksChange).toHaveBeenCalledWith(12);
  });

  test('does not apply the threshold while it is being typed', async () => {
    const user = userEvent.setup();
    renderControls();

    await user.clear(getThresholdInput());
    await user.type(getThresholdInput(), '90');

    expect(onThresholdPercentChange).not.toHaveBeenCalled();
  });

  test('applies the typed threshold on Enter', async () => {
    const user = userEvent.setup();
    renderControls();

    await user.clear(getThresholdInput());
    await user.type(getThresholdInput(), '90{Enter}');

    expect(onThresholdPercentChange).toHaveBeenCalledExactlyOnceWith(90);
  });

  test('applies the typed threshold on blur', async () => {
    const user = userEvent.setup();
    renderControls();

    await user.clear(getThresholdInput());
    await user.type(getThresholdInput(), '60');
    await user.tab();

    expect(onThresholdPercentChange).toHaveBeenCalledExactlyOnceWith(60);
  });

  test('restores the applied threshold when the field is left empty', async () => {
    const user = userEvent.setup();
    renderControls();

    await user.clear(getThresholdInput());
    await user.tab();

    expect(onThresholdPercentChange).not.toHaveBeenCalled();
    expect(getThresholdInput()).toHaveValue(75);
  });

  test('does not apply an unchanged threshold', async () => {
    const user = userEvent.setup();
    renderControls();

    await user.click(getThresholdInput());
    await user.tab();

    expect(onThresholdPercentChange).not.toHaveBeenCalled();
  });

  test('offers reset only while a value differs from its default', async () => {
    const user = userEvent.setup();
    const { rerender } = renderControls();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Reset })).toBeNull();

    rerender(
      <HealthDistributionControls
        weeks={12}
        thresholdPercent={75}
        isModified
        onWeeksChange={onWeeksChange}
        onThresholdPercentChange={onThresholdPercentChange}
        onReset={onReset}
      />,
    );
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Reset }));

    expect(onReset).toHaveBeenCalledOnce();
  });
});
