import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import CronField from '@/src/components/Analytics/Pipelines/Common/CronField';
import { CRON_CUSTOM_PRESET } from '@/src/constants/analytics/pipelines';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';

// The 2.0 select keeps its options in an overlay, so the field is swapped for a native select the
// options can be read out of — as the specs did when this was the 1.0 `DialSelectField`.
vi.mock('@/src/components/Common/SelectField/SelectField', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ id, labelProps, options, value, onChange }: any) => (
    <label>
      <span>{labelProps?.label}</span>
      <select id={id} aria-label={labelProps?.label ?? id} value={value} onChange={(e) => onChange(e.target.value)}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

const HOURLY = '0 0 * * * *';
const EVERY_FIVE_MINUTES = '0 */5 * * * *';

describe('CronField', () => {
  // A discard restores the expression alone, so a stored "custom" flag would outlive the value it
  // described and leave the preset reading empty.
  test('reads an expression matching no preset as custom, however it arrived', () => {
    const { rerender } = renderField({ value: '0 0 * * * *' });

    rerender(<CronField value="0 12/15 * * * *" onChange={vi.fn()} />);

    expect(screen.getByDisplayValue('0 12/15 * * * *')).toBeTruthy();
  });

  const renderField = (props?: Partial<Parameters<typeof CronField>[0]>) =>
    render(<CronField value="" onChange={vi.fn()} {...props} />);

  const preset = () => screen.getByRole('combobox', { name: AnalyticsPipelinesI18nKey.CronPreset });

  test('offers the named presets and a custom entry', async () => {
    const user = userEvent.setup();
    renderField({ value: HOURLY });

    const offered = within(preset())
      .getAllByRole('option')
      .map((option) => option.textContent);

    expect(offered).toContain(AnalyticsPipelinesI18nKey.CronEveryFiveMinutes);
    expect(offered).toContain(AnalyticsPipelinesI18nKey.CronHourly);
    expect(offered).toContain(AnalyticsPipelinesI18nKey.CronDailyMidnight);
    expect(offered).toContain(AnalyticsPipelinesI18nKey.CronCustom);
  });

  test('reports a six-field expression when a preset is chosen', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField({ value: EVERY_FIVE_MINUTES, onChange });

    await user.selectOptions(preset(), HOURLY);

    expect(onChange).toHaveBeenCalledWith('0 0 * * * *');
    expect(onChange.mock.calls[0][0].split(' ')).toHaveLength(6);
  });

  test('hides the expression input until custom is chosen', () => {
    renderField();

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.CronExpression)).toBeNull();
  });

  test('reveals the expression input when custom is chosen', async () => {
    const user = userEvent.setup();
    renderField({ value: HOURLY });

    await user.selectOptions(preset(), CRON_CUSTOM_PRESET);

    expect(screen.getByLabelText(AnalyticsPipelinesI18nKey.CronExpression, { exact: false })).toBeTruthy();
  });

  test('reports a five-field custom expression as invalid', () => {
    renderField({ value: '*/5 * * * *' });

    expect(screen.getByText(AnalyticsPipelinesI18nKey.CronInvalid)).toBeTruthy();
  });

  test('accepts a well-formed six-field custom expression', () => {
    renderField({ value: '0 */5 * * * *' });

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.CronInvalid)).toBeNull();
  });

  test('opens in custom mode for a value matching no preset', () => {
    renderField({ value: '0 30 2 * * MON' });

    expect(screen.getByText(AnalyticsPipelinesI18nKey.CronExpression)).toBeTruthy();
  });

  test('does not report an invalid expression before anything is typed', () => {
    renderField();

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.CronInvalid)).toBeNull();
  });
});
