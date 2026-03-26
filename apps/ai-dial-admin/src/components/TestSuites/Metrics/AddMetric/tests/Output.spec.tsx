import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { SchemaFieldRow } from '@/src/components/Common/SchemaGrid/utils';
import MetricOutput from '../Output';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialTag: ({ tag }: { tag: string }) => <span>{tag}</span>,
}));

const buildField = (overrides: Partial<SchemaFieldRow>): SchemaFieldRow => ({
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

describe('MetricOutput', () => {
  test('returns null when fields are empty', () => {
    const { container } = render(<MetricOutput title="Outputs" fields={[]} />);

    expect(container.firstChild).toBeNull();
  });

  test('renders title and output rows', () => {
    const fields: SchemaFieldRow[] = [
      buildField({ id: 'f1', name: 'score', type: 'number', description: 'Evaluation score' }),
      buildField({ id: 'f2', name: 'passed', type: 'boolean', description: 'Whether the test passed' }),
    ];

    render(<MetricOutput title="Outputs" fields={fields} />);

    expect(screen.getByText('Outputs')).toBeInTheDocument();
    expect(screen.getByText('score')).toBeInTheDocument();
    expect(screen.getByText('Evaluation score')).toBeInTheDocument();
    expect(screen.getByText('passed')).toBeInTheDocument();
    expect(screen.getByText('Whether the test passed')).toBeInTheDocument();
    expect(screen.getByText('number')).toBeInTheDocument();
    expect(screen.getByText('boolean')).toBeInTheDocument();
  });

  test('sets description title attribute for each field', () => {
    const fields: SchemaFieldRow[] = [
      buildField({ id: 'f1', name: 'score', type: 'number', description: 'Evaluation score' }),
    ];

    render(<MetricOutput title="Outputs" fields={fields} />);

    const description = screen.getByText('Evaluation score');
    expect(description).toHaveAttribute('title', 'Evaluation score');
  });
});
