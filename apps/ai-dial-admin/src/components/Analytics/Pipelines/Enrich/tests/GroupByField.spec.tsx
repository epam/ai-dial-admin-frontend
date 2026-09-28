import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import GroupByField from '@/src/components/Analytics/Pipelines/Enrich/GroupByField';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';

// Swapped for a native select so the choice can be made the way a user makes it, as `SourceField.spec` does
// for the same control.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    DialSelectField: ({ id, label, caption, options, value, onChange }: any) => (
      <label>
        <span>{label}</span>
        <select id={id} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {options.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {caption && <span>{caption}</span>}
      </label>
    ),
  };
});

const field = (name: string, source = name): AnalyticsEntityField => ({
  name,
  source,
  type: AnalyticsFieldType.String,
});

const BARE = field('client_session_id');
const QUALIFIED = field('usage_client_identity.client_session_id', 'client_session_id');

const renderField = (props?: Partial<Parameters<typeof GroupByField>[0]>) =>
  render(<GroupByField grainKey="client_session_id" fields={[BARE, QUALIFIED]} onChange={vi.fn()} {...props} />);

describe('GroupByField', () => {
  // Two spellings the service accepts, so the author picks — this is the case the console used to decide
  // for them, sending the bare key a source that reaches it through an enrichment cannot project.
  test('offers every spelling the service accepts', () => {
    renderField();

    const select = screen.getByRole('combobox', { name: AnalyticsPipelinesI18nKey.GroupBy });

    expect(Array.from(select.querySelectorAll('option')).map((option) => option.textContent)).toEqual([
      'client_session_id',
      'usage_client_identity.client_session_id',
    ]);
  });

  test('reports the chosen spelling', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderField({ onChange });

    await user.selectOptions(
      screen.getByRole('combobox', { name: AnalyticsPipelinesI18nKey.GroupBy }),
      'usage_client_identity.client_session_id',
    );

    expect(onChange).toHaveBeenCalledWith('usage_client_identity.client_session_id');
  });

  test('presents the stored spelling rather than the first candidate', () => {
    renderField({ value: 'usage_client_identity.client_session_id' });

    expect(screen.getByRole('combobox', { name: AnalyticsPipelinesI18nKey.GroupBy })).toHaveValue(
      'usage_client_identity.client_session_id',
    );
  });

  // One spelling is no choice: a select with a single option would claim otherwise, so the value is read
  // only and the label says why.
  test('states the single spelling read-only, with the reason on its label', () => {
    renderField({ fields: [QUALIFIED] });

    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.getByText('usage_client_identity.client_session_id')).toBeTruthy();
    expect(screen.getByRole('img', { name: AnalyticsPipelinesI18nKey.GroupByOnlySpelling })).toBeTruthy();
  });

  test('says the source does not reach the key when nothing matches', () => {
    renderField({ fields: [field('response_id')] });

    expect(screen.getByRole('img', { name: AnalyticsPipelinesI18nKey.GroupByUnreachable })).toBeTruthy();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.NotSet)).toBeTruthy();
  });
});
