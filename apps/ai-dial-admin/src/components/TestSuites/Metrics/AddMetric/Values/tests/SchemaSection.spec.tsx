import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import { MetricBinding } from '@/src/models/evaluation/metric';
import MetricSchemaSection from '../SchemaSection';
import { MetricBindingType } from '../../../../../../types/evaluation';

vi.mock('../MetricControl', () => ({
  default: ({ field, binding, onChangeValue }: any) => (
    <div role="group" aria-label={`control-${field.name}`}>
      <span>{field.name}</span>
      <span>{binding?.source?.value ?? 'no-binding'}</span>
      <button type="button" onClick={() => onChangeValue(field.name, `${field.name}-updated`)}>
        Update {field.name}
      </button>
    </div>
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

describe('MetricSchemaSection (Values)', () => {
  test('returns null when fields are empty', () => {
    const { container } = render(<MetricSchemaSection title="Inputs" fields={[]} bindings={[]} />);

    expect(container.firstChild).toBeNull();
  });

  test('renders title and one control per field', () => {
    const fields: SchemaFieldRow[] = [
      makeField({ id: 'f1', name: 'prompt' }),
      makeField({ id: 'f2', name: 'temperature' }),
    ];

    render(<MetricSchemaSection title="Inputs" fields={fields} bindings={[]} />);

    expect(screen.getByText('Inputs')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'control-prompt' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'control-temperature' })).toBeInTheDocument();
  });

  test('calls onChange with updated binding value while preserving other bindings', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const fields: SchemaFieldRow[] = [makeField({ id: 'f1', name: 'prompt' })];
    const bindings: MetricBinding[] = [
      { property: 'prompt', source: { $type: MetricBindingType.Constant, value: 'old-value' } },
      { property: 'temperature', source: { $type: MetricBindingType.Constant, value: '0.5' } },
    ];

    render(<MetricSchemaSection title="Inputs" fields={fields} bindings={bindings} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Update prompt' }));

    expect(onChange).toHaveBeenCalled();
    const updated = onChange.mock.calls[onChange.mock.calls.length - 1][0] as MetricBinding[];

    expect(updated.find((b) => b.property === 'prompt')?.source.value).toBe('prompt-updated');
    expect(updated.find((b) => b.property === 'temperature')?.source.value).toBe('0.5');
  });
});
