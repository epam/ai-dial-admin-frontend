import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { MetricBinding } from '@/src/models/evaluation/metric';
import MetricSchemaSection from '../SchemaSection';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialInput: ({ labelProps, value, onChange, placeholder }: any) => (
    <input
      role="textbox"
      aria-label={labelProps?.label}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  DialNumberInput: ({ labelProps, value, onChange, placeholder }: any) => (
    <input
      role="spinbutton"
      aria-label={labelProps?.label}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  DialSelectField: ({ label, value, onChange, options }: any) => (
    <label>
      <span>{label}</span>
      <select aria-label={label} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
  DialSwitch: ({ label, isOn, onChange }: any) => (
    <label>
      <span>{label}</span>
      <input type="checkbox" role="switch" aria-label={label} checked={!!isOn} onChange={(e) => onChange(e.target.checked)} />
    </label>
  ),
}));

const buildField = (overrides: Partial<SchemaFieldRow>): SchemaFieldRow => ({
  id: overrides.id ?? 'field-id',
  name: overrides.name ?? 'fieldName',
  type: overrides.type ?? 'string',
  required: overrides.required ?? false,
  title: overrides.title ?? '',
  description: overrides.description ?? '',
  expanded: false,
  children: [],
  parentId: null,
  depth: 0,
  enum: overrides.enum,
});

describe('MetricSchemaSection', () => {
  test('renders title and input controls for all supported field types', () => {
    const fields: SchemaFieldRow[] = [
      buildField({ id: 'f1', name: 'plainString', type: 'string' }),
      buildField({ id: 'f2', name: 'enumString', type: 'string', enum: ['A', 'B'] }),
      buildField({ id: 'f3', name: 'numericField', type: 'number' }),
      buildField({ id: 'f4', name: 'booleanField', type: 'boolean' }),
    ];

    const bindings: MetricBinding[] = [
      { property: 'plainString', source: { $type: 'Constant', value: 'hello' } },
      { property: 'enumString', source: { $type: 'Constant', value: 'B' } },
      { property: 'numericField', source: { $type: 'Constant', value: '42' } },
      { property: 'booleanField', source: { $type: 'Constant', value: true as unknown as string } },
    ];

    render(<MetricSchemaSection title="Section Title" fields={fields} bindings={bindings} />);

    expect(screen.getByText('Section Title')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'plainString' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'enumString' })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'numericField' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'booleanField' })).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText(EntityPlaceholdersI18nKey.Value)).toHaveLength(2);
  });

  test('returns null when fields are empty', () => {
    const { container } = render(<MetricSchemaSection title="Empty" fields={[]} bindings={[]} />);

    expect(container.firstChild).toBeNull();
  });

  test('calls onChange with updated binding value for string input', async () => {
    const onChange = vi.fn();

    const fields: SchemaFieldRow[] = [buildField({ id: 'f1', name: 'plainString', type: 'string' })];
    const bindings: MetricBinding[] = [
      { property: 'plainString', source: { $type: 'Constant', value: 'old' } },
      { property: 'other', source: { $type: 'Constant', value: 'keep' } },
    ];

    render(<MetricSchemaSection title="Section" fields={fields} bindings={bindings} onChange={onChange} />);

    const input = screen.getByRole('textbox', { name: 'plainString' });
    fireEvent.change(input, { target: { value: 'new-value' } });

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as MetricBinding[];

    expect(lastCall.find((b) => b.property === 'plainString')?.source.value).toBe('new-value');
    expect(lastCall.find((b) => b.property === 'other')?.source.value).toBe('keep');
  });
});
