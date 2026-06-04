import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import MetricOutputs from '../Outputs';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialTag: ({ label }: { label: string }) => <span>{label}</span>,
}));

const makeField = (overrides: Partial<SchemaFieldRow>): SchemaFieldRow => ({
  id: overrides.id ?? 'field-id',
  name: overrides.name ?? 'fieldName',
  type: overrides.type ?? 'string',
  required: false,
  title: '',
  description: overrides.description ?? '',
  expanded: false,
  children: [],
  parentId: null,
  depth: 0,
});

describe('MetricOutputs', () => {
  test('returns null when fields are empty', () => {
    const { container } = render(<MetricOutputs title="Outputs" fields={[]} />);

    expect(container.firstChild).toBeNull();
  });

  test('renders title and output rows with tags', () => {
    const fields: SchemaFieldRow[] = [
      makeField({ id: 'f1', name: 'score', type: 'number', description: 'Evaluation score' }),
      makeField({ id: 'f2', name: 'passed', type: 'boolean', description: 'Whether passed' }),
    ];

    render(<MetricOutputs title="Outputs" fields={fields} />);

    expect(screen.getByText('Outputs')).toBeInTheDocument();
    expect(screen.getByText('score')).toBeInTheDocument();
    expect(screen.getByText('Evaluation score')).toBeInTheDocument();
    expect(screen.getByText('number')).toBeInTheDocument();
    expect(screen.getByText('passed')).toBeInTheDocument();
    expect(screen.getByText('Whether passed')).toBeInTheDocument();
    expect(screen.getByText('boolean')).toBeInTheDocument();
  });

  test('sets title attribute on description text', () => {
    const fields: SchemaFieldRow[] = [
      makeField({ id: 'f1', name: 'score', type: 'number', description: 'Evaluation score' }),
    ];

    render(<MetricOutputs title="Outputs" fields={fields} />);

    const description = screen.getByText('Evaluation score');
    expect(description).toHaveAttribute('title', 'Evaluation score');
  });
});
