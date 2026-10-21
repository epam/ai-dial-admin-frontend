import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { MetricBinding } from '@/src/models/evaluation/metric';
import MetricControl from '../MetricControl';
import { MetricBindingType } from '../../../../../../types/evaluation';

vi.mock('@/src/components/Common/RemoveButton/RemoveButton', () => ({
  default: ({ onClick }: any) => (
    <button type="button" data-testid="dial-remove-button" aria-label="remove-row" onClick={onClick} />
  ),
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  ButtonAppearance: { Ghost: 'ghost' },
  ElementSize: { Small: 'small' },
  PrimaryButton: ({ onClick, label }: any) => (
    <button type="button" data-testid="dial-primary-button" onClick={onClick}>
      {label}
    </button>
  ),
  DialLabel: ({ label }: any) => <span>{label}</span>,
  DialTextarea: ({ labelProps, placeholder, value, onChange }: any) => (
    <textarea
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
  DialSelect: ({ options, value, onChange, multiple }: any) => (
    <select
      role="combobox"
      aria-label="enum-array-select"
      multiple={multiple}
      value={value ?? (multiple ? [] : '')}
      onChange={(e) => {
        if (multiple) {
          onChange(Array.from(e.target.selectedOptions).map((option) => option.value));
        } else {
          onChange(e.target.value);
        }
      }}
    >
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
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
  Switch: ({ labelProps: { label } = {}, isOn, onChange }: any) => (
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

vi.mock('@/src/components/Common/JsonEditorBase/JsonEditorBase', () => ({
  default: ({ value, onChange }: { value?: string; onChange: (v: string | undefined) => void }) => (
    <textarea
      data-testid="json-editor"
      aria-label="json-editor"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const makeField = (overrides: Partial<SchemaFieldRow>): SchemaFieldRow => ({
  id: 'field-id',
  name: 'field-name',
  type: 'string',
  required: false,
  title: '',
  description: '',
  expanded: false,
  children: [],
  parentId: null,
  depth: 0,
  ...overrides,
});

describe('MetricControl', () => {
  test('renders string textarea and calls onChangeValue', () => {
    const onChangeValue = vi.fn();
    const field = makeField({ id: 'f1', name: 'prompt', type: 'string', required: true, description: 'Prompt text' });
    const binding: MetricBinding = {
      property: 'prompt',
      source: { $type: MetricBindingType.Constant, value: 'hello' },
    };

    render(<MetricControl field={field} binding={binding} onChangeValue={onChangeValue} />);

    const input = screen.getByRole('textbox', { name: 'prompt' });
    expect(input.tagName).toBe('TEXTAREA');
    expect(input).toHaveAttribute('placeholder', EntityPlaceholdersI18nKey.Value);

    fireEvent.change(input, { target: { value: 'updated\ncriteria line' } });

    expect(onChangeValue).toHaveBeenCalledWith('prompt', 'updated\ncriteria line');
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

  test('renders array-of-string rows when schema has primitive items (no child field rows)', () => {
    const onChangeValue = vi.fn();
    const field = makeField({
      id: 'f6',
      name: 'actual',
      type: 'array',
      itemsType: 'string',
      children: [],
    });
    const binding: MetricBinding = {
      property: 'actual',
      source: { $type: MetricBindingType.Constant, value: ['one', 'two'] },
    };

    render(<MetricControl field={field} binding={binding} label={false} onChangeValue={onChangeValue} />);

    const inputs = screen.getAllByRole('textbox', { name: 'text-input' });
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveValue('one');
    expect(inputs[1]).toHaveValue('two');
    expect(screen.getAllByTestId('dial-remove-button')).toHaveLength(2);

    fireEvent.click(screen.getByTestId('dial-primary-button'));
    expect(onChangeValue).toHaveBeenCalledWith('actual', ['one', 'two', '']);
  });

  test('renders JSON editor for plain object and calls onChangeValue with parsed object', () => {
    const onChangeValue = vi.fn();
    const field = makeField({ id: 'f7', name: 'payload', type: 'object' });
    const binding: MetricBinding = {
      property: 'payload',
      source: { $type: MetricBindingType.Constant, value: { a: 1 } },
    };

    render(<MetricControl field={field} binding={binding} label={false} onChangeValue={onChangeValue} />);

    const editor = screen.getByTestId('json-editor');
    expect(editor).toHaveValue(JSON.stringify({ a: 1 }, null, 2));

    fireEvent.change(editor, { target: { value: '{"b":2}' } });
    expect(onChangeValue).toHaveBeenCalledWith('payload', { b: 2 });
  });

  test('renders JSON editor for additionalProperties object maps (Figma Object Constant)', () => {
    const onChangeValue = vi.fn();
    const field = makeField({
      id: 'f7b',
      name: 'actual',
      type: 'object',
      additionalPropertiesArrayItemType: 'string',
    });
    const binding: MetricBinding = {
      property: 'actual',
      source: { $type: MetricBindingType.Constant, value: { key: ['v1'] } },
    };

    render(<MetricControl field={field} binding={binding} label={false} onChangeValue={onChangeValue} />);

    expect(screen.getByTestId('json-editor')).toBeInTheDocument();
    expect(screen.queryByTestId('dial-primary-button')).not.toBeInTheDocument();
  });

  test('does not render JSON editor for nested object fields inside array items', () => {
    const onChangeValue = vi.fn();
    const field = makeField({
      id: 'f-array',
      name: 'tools_called',
      type: 'array',
      itemsType: 'object',
      children: [
        makeField({ id: 'f-name', name: 'name', type: 'string', depth: 1 }),
        makeField({ id: 'f-args', name: 'args', type: 'object', depth: 1 }),
      ],
    });
    const binding: MetricBinding = {
      property: 'tools_called',
      source: { $type: MetricBindingType.Constant, value: [{ name: 'search', args: {} }] },
    };

    render(<MetricControl field={field} binding={binding} label={false} onChangeValue={onChangeValue} />);

    expect(screen.queryByTestId('json-editor')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'name' })).toHaveValue('search');
  });

  test('does not call onChangeValue when plain object JSON is invalid', () => {
    const onChangeValue = vi.fn();
    const field = makeField({ id: 'f8', name: 'payload', type: 'object' });
    const binding: MetricBinding = {
      property: 'payload',
      source: { $type: MetricBindingType.Constant, value: {} },
    };

    render(<MetricControl field={field} binding={binding} label={false} onChangeValue={onChangeValue} />);

    fireEvent.change(screen.getByTestId('json-editor'), { target: { value: '{invalid' } });
    expect(onChangeValue).not.toHaveBeenCalled();
  });

  test('renders multi DialSelect for array fields with enum', () => {
    const onChangeValue = vi.fn();
    const field = makeField({
      id: 'f9',
      name: 'labels',
      type: 'array',
      enum: ['Value 1', 'Value 2', 'Value 3'],
      children: [],
    });
    const binding: MetricBinding = {
      property: 'labels',
      source: { $type: MetricBindingType.Constant, value: ['Value 1'] },
    };

    render(<MetricControl field={field} binding={binding} label={false} onChangeValue={onChangeValue} />);

    const select = screen.getByRole('combobox', { name: 'enum-array-select' });
    expect(select).toHaveAttribute('multiple');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Value 1',
      'Value 2',
      'Value 3',
    ]);

    const options = screen.getAllByRole('option') as HTMLOptionElement[];
    options[0].selected = true;
    options[1].selected = true;
    fireEvent.change(select);
    expect(onChangeValue).toHaveBeenCalledWith('labels', ['Value 1', 'Value 2']);
  });
});
