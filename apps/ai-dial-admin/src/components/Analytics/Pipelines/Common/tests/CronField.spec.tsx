import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import CronField from '@/src/components/Analytics/Pipelines/Common/CronField';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';

const HOURLY = '0 0 * * * *';
const EVERY_FIVE_MINUTES = '0 */5 * * * *';

const renderField = (props?: Partial<Parameters<typeof CronField>[0]>) =>
  render(<CronField value="" onChange={vi.fn()} {...props} />);

const openPresets = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.CronPresets }));

const offered = () => screen.getAllByRole('menuitem').map((item) => item.textContent);

describe('CronField', () => {
  test('is one input labelled Schedule, with no second input and no mode selection', () => {
    renderField({ value: '0 30 2 * * MON' });

    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getByLabelText(AnalyticsPipelinesI18nKey.CronSchedule, { exact: false })).toBeTruthy();
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  test('labels the presets menu with the word rather than an icon alone', () => {
    renderField({ value: HOURLY });

    expect(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.CronPresets }).textContent).toContain(
      AnalyticsPipelinesI18nKey.CronPresets,
    );
  });

  test('offers the named presets from the menu', async () => {
    const user = userEvent.setup();
    renderField({ value: HOURLY });

    await openPresets(user);

    expect(offered()).toEqual([
      AnalyticsPipelinesI18nKey.CronEveryFiveMinutes,
      AnalyticsPipelinesI18nKey.CronHourly,
      AnalyticsPipelinesI18nKey.CronDailyMidnight,
    ]);
  });

  test('writes the six-field expression of the chosen preset into the input', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField({ value: EVERY_FIVE_MINUTES, onChange });

    await openPresets(user);
    await user.click(screen.getByRole('menuitem', { name: AnalyticsPipelinesI18nKey.CronHourly }));

    expect(onChange).toHaveBeenCalledWith(HOURLY);
    expect(onChange.mock.calls[0][0].split(' ')).toHaveLength(6);
  });

  test('keeps whatever expression it is given, with no second input, however it arrived', () => {
    const { rerender } = renderField({ value: HOURLY });

    rerender(<CronField value="0 12/15 * * * *" onChange={vi.fn()} />);

    expect(screen.getByDisplayValue('0 12/15 * * * *')).toBeTruthy();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  test('accepts a typed expression directly', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField({ onChange });

    await user.type(screen.getByRole('textbox'), '0');

    expect(onChange).toHaveBeenCalledWith('0');
  });

  test('reports a five-field expression as invalid', () => {
    renderField({ value: '*/5 * * * *' });

    expect(screen.getByText(AnalyticsPipelinesI18nKey.CronInvalid)).toBeTruthy();
  });

  test('accepts a well-formed six-field expression', () => {
    renderField({ value: '0 30 2 * * MON' });

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.CronInvalid)).toBeNull();
  });

  test('offers no every-minute preset and keeps the cron required when it is not defaultable', async () => {
    const user = userEvent.setup();
    renderField({ value: HOURLY });

    await openPresets(user);

    expect(offered()).not.toContain(AnalyticsPipelinesI18nKey.CronEveryMinute);
    expect(screen.getByRole('textbox')).toBeRequired();
  });
});

describe('CronField — defaultable', () => {
  const renderDefaultable = (props?: Partial<Parameters<typeof CronField>[0]>) =>
    render(<CronField value="" isDefaultable onChange={vi.fn()} {...props} />);

  test('shows a service-defaulted cron as the expression it is', () => {
    renderDefaultable({ value: '37 * * * * *' });

    expect(screen.getByDisplayValue('37 * * * * *')).toBeTruthy();
  });

  test('leaves the input empty, with every minute as its placeholder', () => {
    renderDefaultable();

    expect(screen.getByPlaceholderText(AnalyticsPipelinesI18nKey.CronEveryMinute)).toBeTruthy();
  });

  test('does not mark the cron as required', () => {
    renderDefaultable();

    expect(screen.getByRole('textbox')).not.toBeRequired();
  });

  test('offers every minute first', async () => {
    const user = userEvent.setup();
    renderDefaultable({ value: HOURLY });

    await openPresets(user);

    expect(offered()[0]).toBe(AnalyticsPipelinesI18nKey.CronEveryMinute);
  });

  test('clears the cron when every minute is chosen over another preset', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderDefaultable({ value: HOURLY, onChange });

    await openPresets(user);
    await user.click(screen.getByRole('menuitem', { name: AnalyticsPipelinesI18nKey.CronEveryMinute }));

    expect(onChange).toHaveBeenCalledWith('');
  });

  test('keeps a cron that already fires every minute', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderDefaultable({ value: '37 * * * * *', onChange });

    await openPresets(user);
    await user.click(screen.getByRole('menuitem', { name: AnalyticsPipelinesI18nKey.CronEveryMinute }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
