import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import CronField from '@/src/components/Analytics/EnrichmentRules/CronField';
import { AnalyticsEnrichmentRulesI18nKey } from '@/src/constants/i18n';

const HOURLY = '0 0 * * * *';
const EVERY_FIVE_MINUTES = '0 */5 * * * *';

describe('CronField', () => {
  const renderField = (props?: Partial<Parameters<typeof CronField>[0]>) =>
    render(<CronField value="" onChange={vi.fn()} {...props} />);

  test('offers the named presets and a custom entry', async () => {
    const user = userEvent.setup();
    renderField({ value: HOURLY });

    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.CronHourly));

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.CronEveryFiveMinutes)).toBeTruthy();
    expect(screen.getAllByText(AnalyticsEnrichmentRulesI18nKey.CronHourly).length).toBeGreaterThan(1);
    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.CronDailyMidnight)).toBeTruthy();
    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.CronCustom)).toBeTruthy();
  });

  test('reports a six-field expression when a preset is chosen', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField({ value: EVERY_FIVE_MINUTES, onChange });

    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.CronEveryFiveMinutes));
    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.CronHourly));

    expect(onChange).toHaveBeenCalledWith('0 0 * * * *');
    expect(onChange.mock.calls[0][0].split(' ')).toHaveLength(6);
  });

  test('hides the expression input until custom is chosen', () => {
    renderField();

    expect(screen.queryByText(AnalyticsEnrichmentRulesI18nKey.CronExpression)).toBeNull();
  });

  test('reveals the expression input when custom is chosen', async () => {
    const user = userEvent.setup();
    renderField({ value: HOURLY });

    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.CronHourly));
    await user.click(screen.getByText(AnalyticsEnrichmentRulesI18nKey.CronCustom));

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.CronExpression)).toBeTruthy();
  });

  test('reports a five-field custom expression as invalid', () => {
    renderField({ value: '*/5 * * * *' });

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.CronInvalid)).toBeTruthy();
  });

  test('accepts a well-formed six-field custom expression', () => {
    renderField({ value: '0 */5 * * * *' });

    expect(screen.queryByText(AnalyticsEnrichmentRulesI18nKey.CronInvalid)).toBeNull();
  });

  test('opens in custom mode for a value matching no preset', () => {
    renderField({ value: '0 30 2 * * MON' });

    expect(screen.getByText(AnalyticsEnrichmentRulesI18nKey.CronExpression)).toBeTruthy();
  });

  test('does not report an invalid expression before anything is typed', () => {
    renderField();

    expect(screen.queryByText(AnalyticsEnrichmentRulesI18nKey.CronInvalid)).toBeNull();
  });
});
