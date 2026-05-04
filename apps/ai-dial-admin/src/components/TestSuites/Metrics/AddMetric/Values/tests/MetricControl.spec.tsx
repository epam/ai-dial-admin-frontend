import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { MetricBinding } from '@/src/models/evaluation/metric';
import MetricControl from '../MetricControl';
import { MetricBindingType } from '../../../../../../types/evaluation';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialInput: ({ labelProps, placeholder, value, onChange }: any) => (
    <input
      role="textbox"
      aria-label={labelProps?.label ?? 'text-input'}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  DialNumberInput: ({ labelProps, placeholder, value, onChange }: any) => (
    <input
      role="spinbutton"
      aria-label={labelProps?.label ?? 'number-input'}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  DialSelectField: ({ label, value, options, onChange }: any) => (
    <label>
      <span>{label ?? 'select-input'}</span>
      <select aria-label={label ?? 'select-input'} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
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
      <span>{label ?? 'switch-input'}</span>
      <input
        type="checkbox"
        role="switch"
        aria-label={label ?? 'switch-input'}
        checked={!!isOn}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  ),
}));

const makeField = (overrides: Partial<SchemaFieldRow>): SchemaFieldRow => ({
  id: overrides.id ?? 'field-id',
  name: overrides.name ?? 'field-name',
  type: overrides.type ?? 'string',
  required: overrides.required ?? false,
  title: '',
  description: overrides.description ?? '',
  expanded: false,
  children: [],
  parentId: null,
  depth: 0,
  enum: overrides.enum,
});

describe('MetricControl', () => {
  test('renders string input and calls onChangeValue', () => {
    const onChangeValue = vi.fn();
    const field = makeField({ id: 'f1', name: 'prompt', type: 'string', required: true, description: 'Prompt text' });
    const binding: MetricBinding = {
      property: 'prompt',
      source: { $type: MetricBindingType.Constant, value: 'hello' },
    };

    render(<MetricControl field={field} binding={binding} onChangeValue={onChangeValue} />);

    const input = screen.getByRole('textbox', { name: 'prompt' });
    expect(input).toHaveAttribute('placeholder', EntityPlaceholdersI18nKey.Value);

    fireEvent.change(input, { target: { value: 'updated' } });

    expect(onChangeValue).toHaveBeenCalledWith('prompt', 'updated');
  });

  test('renders enum select and calls onChangeValue', () => {
    const onChangeValue = vi.fn();
    const field = makeField({ id: 'f2', name: 'mode', type: 'string', enum: ['A', 'B'] });
    const binding: MetricBinding = {
      property: 'mode',
      source: { $type: MetricBindingType.Constant, value: 'A' },
    };

    render(<MetricControl field={field} binding={binding} onChangeValue={onChangeValue} />);

    const select = screen.getByRole('combobox', { name: 'mode' });
    fireEvent.change(select, { target: { value: 'B' } });

    expect(onChangeValue).toHaveBeenCalledWith('mode', 'B');
  });

  test('renders number input and calls onChangeValue', () => {
    const onChangeValue = vi.fn();
    const field = makeField({ id: 'f3', name: 'temperature', type: 'number' });
    const binding: MetricBinding = {
      property: 'temperature',
      source: { $type: MetricBindingType.Constant, value: '0.7' },
    };

    render(<MetricControl field={field} binding={binding} onChangeValue={onChangeValue} />);

    const input = screen.getByRole('spinbutton', { name: 'temperature' });
    fireEvent.change(input, { target: { value: '0.9' } });

    expect(onChangeValue).toHaveBeenCalledWith('temperature', '0.9');
  });

  test('renders switch and converts boolean to string in onChangeValue', () => {
    const onChangeValue = vi.fn();
    const field = makeField({ id: 'f4', name: 'enabled', type: 'boolean' });
    const binding: MetricBinding = {
      property: 'enabled',
      source: { $type: MetricBindingType.Constant, value: false as unknown as string },
    };

    render(<MetricControl field={field} binding={binding} onChangeValue={onChangeValue} />);

    const switchInput = screen.getByRole('switch', { name: 'enabled' });
    fireEvent.click(switchInput);

    expect(onChangeValue).toHaveBeenCalledWith('enabled', true);
  });

  test('renders controls without field label when label prop is false', () => {
    const onChangeValue = vi.fn();
    const field = makeField({ id: 'f5', name: 'hiddenLabel', type: 'string' });

    render(<MetricControl field={field} label={false} onChangeValue={onChangeValue} />);

    expect(screen.getByRole('textbox', { name: 'text-input' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'hiddenLabel' })).not.toBeInTheDocument();
  });
});
