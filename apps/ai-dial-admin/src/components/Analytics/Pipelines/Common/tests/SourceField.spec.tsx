import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import SourceField from '@/src/components/Analytics/Pipelines/Common/SourceField';
import SqlPredicateField from '@/src/components/Analytics/Pipelines/Common/SqlPredicateField';
import { FOLLOW_TARGET_SOURCE } from '@/src/constants/analytics/pipelines';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';
import { getSourceMode } from '@/src/utils/analytics/pipeline-dto';
import { SourceMode } from '@/src/models/analytics/pipeline-ui';

// Swapped for a native select so the choice can be made the way a user makes it.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialSelectField: ({ id, label, caption, options, value, onChange }: any) => (
      <label>
        <span>{label}</span>
        <select id={id} aria-label={label} value={value} onChange={(e: any) => onChange(e.target.value)}>
          {options.map((o: any) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {caption && <span>{caption}</span>}
      </label>
    ),
  };
});

const tables: AnalyticsTable[] = [
  { name: 'dial_usage_log', type: AnalyticsTableType.Source },
  { name: 'legacy_log', type: AnalyticsTableType.Source },
  { name: 'turn_feedback', type: AnalyticsTableType.Enrichment },
];

describe('SourceField', () => {
  const renderField = (props?: Partial<Parameters<typeof SourceField>[0]>) =>
    render(<SourceField tables={tables} sourceTable="dial_usage_log" onChange={vi.fn()} {...props} />);

  const select = () => screen.getByRole('combobox');
  const optionLabels = () => Array.from(select().querySelectorAll('option')).map((option) => option.textContent);

  test('reads a rule with no declared source as following', () => {
    renderField();

    expect((select() as HTMLSelectElement).value).toBe(FOLLOW_TARGET_SOURCE);
  });

  // The compiled read resolves the input either way, so this is what a following pipeline arrives as.
  test('reads a resolved input equal to the target source as following', () => {
    renderField({ input: 'dial_usage_log' });

    expect((select() as HTMLSelectElement).value).toBe(FOLLOW_TARGET_SOURCE);
  });

  test('reads a declared source as pinned to it', () => {
    renderField({ input: 'legacy_log' });

    expect((select() as HTMLSelectElement).value).toBe('legacy_log');
  });

  test('names the table currently being followed', () => {
    renderField();

    expect(optionLabels().some((label) => label?.includes('dial_usage_log'))).toBe(true);
  });

  test('says the source is unresolved before the target lands', () => {
    renderField({ sourceTable: undefined });

    expect(optionLabels()).toContain(AnalyticsPipelinesI18nKey.SourceFollowUnresolved);
  });

  test('clears the source when following is chosen', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField({ input: 'legacy_log', onChange });

    await user.selectOptions(select(), FOLLOW_TARGET_SOURCE);

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  test('pins a table that differs from the one being followed', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField({ onChange });

    await user.selectOptions(select(), 'legacy_log');

    expect(onChange).toHaveBeenCalledWith('legacy_log');
  });

  test('keeps a pinned table the listing does not carry', () => {
    renderField({ input: 'retired_log' });

    expect((select() as HTMLSelectElement).value).toBe('retired_log');
  });

  test('offers only source tables beside the following entry', () => {
    renderField();

    expect(optionLabels()).toContain('legacy_log');
    expect(optionLabels()).not.toContain('turn_feedback');
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
