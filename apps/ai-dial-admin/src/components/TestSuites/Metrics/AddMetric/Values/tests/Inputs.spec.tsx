import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { EntityPlaceholdersI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { AttributeSamples } from '@/src/models/evaluation/attribute-samples';
import { MetricBinding } from '@/src/models/evaluation/metric';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { MetricBindingType, TestCaseItemType } from '@/src/types/evaluation';
import MetricInputs from '../Inputs';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  TooltipPlacement: { Left: 'left' },
  ErrorText: ({ text }: any) => (text ? <span role="alert">{text}</span> : null),
  DialLabel: ({ label }: any) => <span>{label}</span>,
  DialTag: ({ label }: any) => <span data-testid="type-tag">{label}</span>,
  Select: ({ id, options, value, onChange, placeholder, fieldClassName, invalid }: any) => (
    <select
      id={id}
      role="combobox"
      value={value ?? ''}
      data-placeholder={placeholder}
      data-field-class={fieldClassName}
      aria-invalid={invalid}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option: any) => (
        <option
          key={option.value}
          value={option.value}
          data-has-tag={Boolean(option.rightControl)}
          data-has-tooltip={Boolean(option.interactiveTooltip)}
        >
          {option.label}
          {option.rightControl}
        </option>
      ))}
    </select>
  ),
  DialSegmentedControl: ({ options, value, onChange, ariaLabel }: any) => (
    <div role="tablist" aria-label={ariaLabel}>
      {options.map((option: any) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../MetricControl', () => ({
  default: ({ field, onChangeValue }: any) => (
    <button type="button" onClick={() => onChangeValue(field.name, 'constant-updated')}>
      Update constant {field.name}
    </button>
  ),
}));

vi.mock('../MetricSectionTabs', () => ({
  default: ({ title, controlsContent }: any) => (
    <div>
      <h4>{title}</h4>
      {controlsContent}
    </div>
  ),
}));

const makeField = (overrides: Partial<SchemaFieldRow>): SchemaFieldRow => ({
  itemsType: overrides.itemsType,
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

  test('shows the hint describing the expected input format', () => {
    render(<MetricInputs title="Inputs" fields={[makeField({ id: 'f1', name: 'prompt' })]} bindings={[]} />);

    expect(screen.getByText(TestSuitesI18nKey.InputsHint)).toBeInTheDocument();
  });

  test('shows the expected type next to each input', () => {
    const fields: SchemaFieldRow[] = [
      makeField({ id: 'f1', name: 'actual', type: 'array', itemsType: 'string' }),
      makeField({ id: 'f2', name: 'prompt', type: 'number' }),
    ];

    render(<MetricInputs title="Inputs" fields={fields} bindings={[]} />);

    expect(screen.getByText('Array<String>')).toBeInTheDocument();
    expect(screen.getByText('Number')).toBeInTheDocument();
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

  test('response column options include columns from additionalRequests in the chain', () => {
    const fields: SchemaFieldRow[] = [makeField({ id: 'f1', name: 'prompt' })];
    const bindings: MetricBinding[] = [
      { property: 'prompt', source: { $type: MetricBindingType.Response, columnName: 'answer' } },
    ];
    const selectedTestSuite: TestSuite = {
      responseColumns: [{ name: 'answer', displayName: 'Answer', expression: '', type: 'string' }],
      additionalRequests: [
        { responseColumns: [{ name: 'follow_up', displayName: 'Follow up', expression: '', type: 'string' }] },
      ],
    };

    render(
      <MetricInputs
        title="Inputs"
        fields={fields}
        bindings={bindings}
        selectedTestSuite={selectedTestSuite}
        onChange={vi.fn()}
      />,
    );

    const options = screen.getAllByRole('option');
    expect(options.map((option) => option.getAttribute('value'))).toEqual(['answer', 'follow_up']);
    expect(options.every((option) => option.getAttribute('data-has-tag') === 'true')).toBe(true);
    expect(screen.getAllByTestId('type-tag').map((tag) => tag.textContent)).toEqual(['String', 'String', 'String']);
    expect(screen.getByRole('combobox')).toHaveAttribute('data-placeholder', EntityPlaceholdersI18nKey.Select);
  });

  test('test case options include all schema columns with type tags', () => {
    const fields: SchemaFieldRow[] = [makeField({ id: 'f1', name: 'prompt', type: 'array' })];
    const bindings: MetricBinding[] = [
      { property: 'prompt', source: { $type: MetricBindingType.TestCase, columnName: 'question' } },
    ];

    render(
      <MetricInputs
        title="Inputs"
        fields={fields}
        bindings={bindings}
        testCaseSchema={[
          {
            name: 'question',
            type: TestCaseItemType.STRING,
            required: true,
            description: '',
          },
          {
            name: 'score',
            type: TestCaseItemType.NUMBER,
            required: false,
            description: '',
          },
        ]}
        onChange={vi.fn()}
      />,
    );

    const options = screen.getAllByRole('option');
    expect(options.map((option) => option.getAttribute('value'))).toEqual(['question', 'score']);
    expect(screen.getAllByTestId('type-tag').map((tag) => tag.textContent)).toEqual(['Array', 'String', 'Number']);
  });

  test('test case options include sample tooltip when samples are provided', () => {
    const fields: SchemaFieldRow[] = [makeField({ id: 'f1', name: 'prompt', type: 'string' })];
    const bindings: MetricBinding[] = [
      { property: 'prompt', source: { $type: MetricBindingType.TestCase, columnName: 'question' } },
    ];
    const samples: AttributeSamples = {
      valuesByField: { question: ['hello', 'world'] },
      totalCount: 10,
    };

    render(
      <MetricInputs
        title="Inputs"
        fields={fields}
        bindings={bindings}
        samples={samples}
        testCaseSchema={[
          {
            name: 'question',
            type: TestCaseItemType.STRING,
            required: true,
            description: '',
          },
        ]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('option')).toHaveAttribute('data-has-tooltip', 'true');
  });
});

describe('MetricInputs type matching', () => {
  const testCaseColumn = (name: string, type: TestCaseItemType) => ({ name, type, required: false, description: '' });
  const testCaseBinding = (columnName: string): MetricBinding[] => [
    { property: 'actual', source: { $type: MetricBindingType.TestCase, columnName } },
  ];

  test('flags a test case column whose type differs from the expected one', () => {
    render(
      <MetricInputs
        title="Inputs"
        fields={[makeField({ id: 'f1', name: 'actual', type: 'array' })]}
        bindings={testCaseBinding('question')}
        testCaseSchema={[testCaseColumn('question', TestCaseItemType.STRING)]}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(TestSuitesI18nKey.InputTypeMismatch);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
  });

  test('does not flag a test case column with a matching type', () => {
    render(
      <MetricInputs
        title="Inputs"
        fields={[makeField({ id: 'f1', name: 'actual', type: 'array' })]}
        bindings={testCaseBinding('items')}
        testCaseSchema={[testCaseColumn('items', TestCaseItemType.ARRAY)]}
      />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('treats number and integer as compatible', () => {
    render(
      <MetricInputs
        title="Inputs"
        fields={[makeField({ id: 'f1', name: 'actual', type: 'number' })]}
        bindings={testCaseBinding('count')}
        testCaseSchema={[testCaseColumn('count', TestCaseItemType.INTEGER)]}
      />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('flags a response column whose type differs from the expected one', () => {
    const selectedTestSuite: TestSuite = {
      responseColumns: [{ name: 'answer', displayName: 'Answer', expression: '', type: 'string' }],
    };

    render(
      <MetricInputs
        title="Inputs"
        fields={[makeField({ id: 'f1', name: 'actual', type: 'array' })]}
        bindings={[{ property: 'actual', source: { $type: MetricBindingType.Response, columnName: 'answer' } }]}
        selectedTestSuite={selectedTestSuite}
      />,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('shows no error while no column is selected', () => {
    render(
      <MetricInputs
        title="Inputs"
        fields={[makeField({ id: 'f1', name: 'actual', type: 'array' })]}
        bindings={[{ property: 'actual', source: { $type: MetricBindingType.TestCase } }]}
        testCaseSchema={[testCaseColumn('question', TestCaseItemType.STRING)]}
      />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
