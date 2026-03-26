import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { MetricBinding } from '@/src/models/evaluation/metric';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { MetricBindingType, TestCaseItemType } from '@/src/types/evaluation';
import MetricInputs from '../Inputs';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialLabel: ({ label }: any) => <span>{label}</span>,
  DialSelect: ({ options, value, onChange }: any) => (
    <select role="combobox" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('../MetricControl', () => ({
  default: ({ field, onChangeValue }: any) => (
    <button type="button" onClick={() => onChangeValue('constant-updated')}>
      Update constant {field.name}
    </button>
  ),
}));

const makeField = (overrides: Partial<SchemaFieldRow>): SchemaFieldRow => ({
  id: overrides.id ?? 'field-id',
  name: overrides.name ?? 'field-name',
  type: overrides.type ?? 'string',
  required: false,
  title: '',
  description: '',
  expanded: false,
  children: [],
  parentId: null,
  depth: 0,
});

describe('MetricInputs (Values)', () => {
  test('returns null when fields are empty', () => {
    const { container } = render(<MetricInputs title="Inputs" fields={[]} bindings={[]} />);

    expect(container.firstChild).toBeNull();
  });

  test('renders title and field label', () => {
    const fields: SchemaFieldRow[] = [makeField({ id: 'f1', name: 'prompt' })];

    render(<MetricInputs title="Inputs" fields={fields} bindings={[]} />);

    expect(screen.getByText('Inputs')).toBeInTheDocument();
    expect(screen.getByText('prompt')).toBeInTheDocument();
  });

  test('updates binding type when switching tab', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const fields: SchemaFieldRow[] = [makeField({ id: 'f1', name: 'prompt' })];
    const bindings: MetricBinding[] = [
      { property: 'prompt', source: { $type: MetricBindingType.Constant, value: 'old' } },
    ];

    render(<MetricInputs title="Inputs" fields={fields} bindings={bindings} onChange={onChange} />);

    await user.click(screen.getByText(TestSuitesI18nKey.ResponseColumn));

    const updatedBindings = onChange.mock.calls[onChange.mock.calls.length - 1][0] as MetricBinding[];
    expect(updatedBindings[0].source).toEqual({ $type: MetricBindingType.Response });
  });

  test('updates constant binding value via MetricControl', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const fields: SchemaFieldRow[] = [makeField({ id: 'f1', name: 'prompt' })];
    const bindings: MetricBinding[] = [
      { property: 'prompt', source: { $type: MetricBindingType.Constant, value: 'old' } },
      { property: 'temperature', source: { $type: MetricBindingType.Constant, value: '0.5' } },
    ];

    render(<MetricInputs title="Inputs" fields={fields} bindings={bindings} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Update constant prompt' }));

    const updatedBindings = onChange.mock.calls[onChange.mock.calls.length - 1][0] as MetricBinding[];
    expect(updatedBindings.find((b) => b.property === 'prompt')?.source).toEqual({
      $type: MetricBindingType.Constant,
      value: 'constant-updated',
    });
    expect(updatedBindings.find((b) => b.property === 'temperature')?.source.value).toBe('0.5');
  });

  test('updates response column binding when response tab is active', () => {
    const onChange = vi.fn();
    const fields: SchemaFieldRow[] = [makeField({ id: 'f1', name: 'prompt' })];
    const bindings: MetricBinding[] = [
      { property: 'prompt', source: { $type: MetricBindingType.Response, columnName: 'oldCol' } },
    ];
    const selectedTestSuite: TestSuite = {
      responseColumns: [{ name: 'answer', displayName: 'Answer', expression: '', type: 'string' }],
    };

    render(
      <MetricInputs
        title="Inputs"
        fields={fields}
        bindings={bindings}
        selectedTestSuite={selectedTestSuite}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'answer' } });

    const updatedBindings = onChange.mock.calls[onChange.mock.calls.length - 1][0] as MetricBinding[];
    expect(updatedBindings[0].source).toEqual({ $type: MetricBindingType.Response, columnName: 'answer' });
  });

  test('updates test case binding when test-case tab is active', () => {
    const onChange = vi.fn();
    const fields: SchemaFieldRow[] = [makeField({ id: 'f1', name: 'prompt' })];
    const bindings: MetricBinding[] = [
      { property: 'prompt', source: { $type: MetricBindingType.TestCase, value: 'q1' } },
    ];
    const selectedTestSuite: TestSuite = {
      testCaseSchema: [{ name: 'question', type: TestCaseItemType.STRING, required: false, description: '' }],
    };

    render(
      <MetricInputs
        title="Inputs"
        fields={fields}
        bindings={bindings}
        selectedTestSuite={selectedTestSuite}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'question' } });

    const updatedBindings = onChange.mock.calls[onChange.mock.calls.length - 1][0] as MetricBinding[];
    expect(updatedBindings[0].source).toEqual({ $type: MetricBindingType.TestCase, value: 'question' });
  });
});
