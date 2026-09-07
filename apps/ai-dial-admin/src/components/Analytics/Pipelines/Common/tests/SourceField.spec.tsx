import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import SourceField from '@/src/components/Analytics/Pipelines/Common/SourceField';
import SqlPredicateField from '@/src/components/Analytics/Pipelines/Common/SqlPredicateField';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';
import { getSourceMode } from '@/src/utils/analytics/pipeline-dto';
import { SourceMode } from '@/src/models/analytics/pipeline-ui';

const tables: AnalyticsTable[] = [
  { name: 'dial_usage_log', type: AnalyticsTableType.Source },
  { name: 'legacy_log', type: AnalyticsTableType.Source },
  { name: 'turn_feedback', type: AnalyticsTableType.Enrichment },
];

describe('SourceField', () => {
  const renderField = (props?: Partial<Parameters<typeof SourceField>[0]>) =>
    render(<SourceField tables={tables} sourceTable="dial_usage_log" onChange={vi.fn()} {...props} />);

  test('reads a rule with no declared source as following', () => {
    renderField();

    expect(screen.getByRole('radio', { name: /SourceFollow/ })).toBeChecked();
  });

  test('reads a source equal to the enrichment default as following', () => {
    renderField({ input: 'dial_usage_log' });

    expect(screen.getByRole('radio', { name: /SourceFollow/ })).toBeChecked();
  });

  test('reads a source differing from the enrichment default as pinned', () => {
    renderField({ input: 'legacy_log' });

    expect(screen.getByRole('radio', { name: /SourcePin/ })).toBeChecked();
  });

  test('names the table currently being followed', () => {
    renderField();

    expect(screen.getByText(/dial_usage_log/)).toBeTruthy();
  });

  test('says the source is unresolved before the target lands', () => {
    renderField({ sourceTable: undefined });

    expect(screen.getByText(AnalyticsPipelinesI18nKey.SourceFollowUnresolved)).toBeTruthy();
  });

  test('clears the source when following is chosen', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField({ input: 'legacy_log', onChange });

    await user.click(screen.getByRole('radio', { name: /SourceFollow/ }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  test('switches to pin and stays there', async () => {
    const user = userEvent.setup();
    renderField();

    await user.click(screen.getByRole('radio', { name: /SourcePin/ }));

    // Regression: seeding the value with the followed table made getSourceMode read it back as "follow",
    // so the radio snapped back and pinning was unreachable.
    expect(screen.getByRole('radio', { name: /SourcePin/ })).toBeChecked();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.SourceTable)).toBeTruthy();
  });

  test('offers only source tables to pin', () => {
    renderField({ input: 'legacy_log' });

    expect(screen.getByText(AnalyticsPipelinesI18nKey.SourceTable)).toBeTruthy();
    expect(screen.queryByText('turn_feedback')).toBeNull();
  });

  test('hides the table select while following', () => {
    renderField();

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.SourceTable)).toBeNull();
  });
});

describe('getSourceMode', () => {
  test('treats an absent source as following', () => {
    expect(getSourceMode(undefined, 'dial_usage_log')).toBe(SourceMode.Follow);
  });

  test('treats a source equal to the enrichment default as following', () => {
    expect(getSourceMode(['dial_usage_log'], 'dial_usage_log')).toBe(SourceMode.Follow);
  });

  test('treats a differing source as pinned', () => {
    expect(getSourceMode(['legacy_log'], 'dial_usage_log')).toBe(SourceMode.Pin);
  });
});

describe('SqlPredicateField', () => {
  const renderField = (props?: Partial<Parameters<typeof SqlPredicateField>[0]>) =>
    render(<SqlPredicateField id="p" label="Filter" onChange={vi.fn()} {...props} />);

  test('names the table its columns come from', () => {
    renderField({ sourceName: 'dial_usage_log' });

    expect(screen.getByText(/dial_usage_log/)).toBeTruthy();
  });

  test('says so when the read source has not resolved', () => {
    renderField();

    expect(screen.getByText(AnalyticsPipelinesI18nKey.PredicateSourceUnresolved)).toBeTruthy();
  });

  test('reports what was typed', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField({ onChange });

    await user.type(screen.getByRole('textbox', { name: 'Filter' }), 'a');

    expect(onChange).toHaveBeenCalledWith('a');
  });

  test('accepts an expression the service would reject without flagging it', () => {
    renderField({ value: 'this is not sql (' });

    expect(screen.getByRole('textbox', { name: 'Filter' })).toHaveValue('this is not sql (');
  });
});
