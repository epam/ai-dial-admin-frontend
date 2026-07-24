import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import ColumnRowsEditor from '@/src/components/Analytics/Tables/ColumnRowsEditor';
import { createColumnRow } from '@/src/components/Analytics/Tables/utils';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { ColumnRow } from '@/src/models/analytics/tables-ui';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialSelectField: ({ label, options, value, onChange, error }: any) => (
      <label>
        <span>{label}</span>
        <select aria-label={label} value={value} onChange={(e: any) => onChange(e.target.value)}>
          {options.map((o: any) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <span role="alert">{error}</span>}
      </label>
    ),
    DialSwitch: ({ label, isOn, disabled, onChange }: any) => (
      <label>
        <span>{label}</span>
        <input
          type="checkbox"
          role="switch"
          aria-label={label}
          checked={!!isOn}
          disabled={!!disabled}
          onChange={() => onChange(!isOn)}
        />
      </label>
    ),
  };
});

const row = (overrides?: Partial<ColumnRow>): ColumnRow => ({ ...createColumnRow(), ...overrides });

describe('ColumnRowsEditor', () => {
  test('a single Name field fills both source_name and name on the row', () => {
    const onChange = vi.fn();
    render(<ColumnRowsEditor rows={[row()]} onChange={onChange} />);

    // A dedicated "Source name" field was merged away — guard against it silently reappearing.
    expect(screen.queryByLabelText('AnalyticsTables.SourceName', { exact: false })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(AnalyticsTablesI18nKey.ColumnName, { exact: false }), {
      target: { value: 'event_id' },
    });

    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ source_name: 'event_id', name: 'event_id' })]);
  });

  test('does not render the element-type field for a non-Array row', () => {
    render(<ColumnRowsEditor rows={[row()]} onChange={vi.fn()} />);
    expect(screen.queryByLabelText(AnalyticsTablesI18nKey.ElementType)).not.toBeInTheDocument();
  });

  test('renders the element-type field once the row type is Array', () => {
    render(<ColumnRowsEditor rows={[row({ type: AnalyticsFieldType.Array })]} onChange={vi.fn()} />);
    expect(screen.getByLabelText(AnalyticsTablesI18nKey.ElementType)).toBeInTheDocument();
  });

  test('choosing an element type patches the row', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ColumnRowsEditor rows={[row({ type: AnalyticsFieldType.Array })]} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText(AnalyticsTablesI18nKey.ElementType), AnalyticsFieldType.String);

    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ element_type: AnalyticsFieldType.String })]);
  });

  test('changing the type away from Array clears any chosen element_type', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ColumnRowsEditor
        rows={[row({ type: AnalyticsFieldType.Array, element_type: AnalyticsFieldType.String })]}
        onChange={onChange}
      />,
    );

    await user.selectOptions(screen.getByLabelText(AnalyticsTablesI18nKey.Type), AnalyticsFieldType.String);

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ type: AnalyticsFieldType.String, element_type: '' }),
    ]);
  });

  test('the Nullable switch is disabled and forced off for an Array row, even if nullable was already true', () => {
    render(<ColumnRowsEditor rows={[row({ type: AnalyticsFieldType.Array, nullable: true })]} onChange={vi.fn()} />);

    const nullableSwitch = screen.getByLabelText(AnalyticsTablesI18nKey.Nullable);
    expect(nullableSwitch).toBeDisabled();
    expect(nullableSwitch).not.toBeChecked();
  });

  test('the Nullable switch stays enabled for a non-Array row', () => {
    render(<ColumnRowsEditor rows={[row()]} onChange={vi.fn()} />);
    expect(screen.getByLabelText(AnalyticsTablesI18nKey.Nullable)).toBeEnabled();
  });

  test('shows a validation error on the element-type field', () => {
    render(
      <ColumnRowsEditor
        rows={[row({ type: AnalyticsFieldType.Array })]}
        errors={[{ element_type: 'Required' }]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });
});
