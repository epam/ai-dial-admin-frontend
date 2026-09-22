import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';

import OutputsEditor from '@/src/components/Analytics/Pipelines/Enrich/OutputsEditor';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { TransformOutput, TransformType } from '@/src/models/analytics/pipeline';
import { OutputRefinementKind } from '@/src/models/analytics/pipeline-ui';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';

// Swapped for a native select so a choice can be made the way a user makes it.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialSelectField: ({ id, label, options, value, onChange, error }: any) => (
      <label>
        <span>{label}</span>
        <select id={id} aria-label={label} value={value} onChange={(e: any) => onChange(e.target.value)}>
          {options.map((o: any) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <span>{error}</span>}
      </label>
    ),
  };
});

const column = (overrides: Partial<AnalyticsTableColumn>): AnalyticsTableColumn => ({
  source_name: overrides.name ?? 'col',
  name: 'col',
  type: AnalyticsFieldType.String,
  ...overrides,
});

const COLUMNS: AnalyticsTableColumn[] = [
  column({ name: 'summary', description: 'One-line summary of the session.' }),
  column({ name: 'risk_level', type: AnalyticsFieldType.Enum, enum_values: ['low', 'high'] }),
  column({ name: 'topic' }),
  column({ name: 'pipeline_generation', type: AnalyticsFieldType.Long, tag: 'system' }),
];

// The editor is controlled: it publishes rows and is re-seeded from what it published, so a host holding
// the state is what exercises it the way the forms do.
const Host = ({
  type,
  seed = [],
  columns = COLUMNS,
}: {
  type: TransformType;
  seed?: TransformOutput[];
  columns?: AnalyticsTableColumn[];
}) => {
  const [outputs, setOutputs] = useState<TransformOutput[]>(seed);
  return <OutputsEditor outputs={outputs} type={type} columns={columns} isReady onChange={setOutputs} />;
};

const addButton = () => screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.AddOutput });
const nameField = () =>
  screen.getByLabelText(AnalyticsPipelinesI18nKey.OutputColumn, { exact: false, selector: 'select' });
const optionValues = (select: HTMLElement) =>
  Array.from(select.querySelectorAll('option')).map((option) => option.value);

describe('OutputsEditor — an llm transform', () => {
  test('presents prose and, for an output declaring no refinement, an empty transform', () => {
    render(<Host type={TransformType.Llm} seed={[{ name: 'risk_level', prose: 'Severity.' }]} />);

    expect(screen.getByLabelText(`${AnalyticsPipelinesI18nKey.OutputProse} 1`, { exact: false })).toBeTruthy();
    expect(screen.getByLabelText(AnalyticsPipelinesI18nKey.OutputRefinement)).toBeTruthy();
    expect(screen.getByLabelText(`${AnalyticsPipelinesI18nKey.OutputJsonata} 1`, { exact: false })).toHaveValue('');
  });

  test('states that the order is the order the model answers in', () => {
    render(<Host type={TransformType.Llm} seed={[{ name: 'summary', prose: 'Severity.' }]} />);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.OutputsOrderHint)).toBeTruthy();
  });

  test('leaves the refinement out when the caller asks for the required members only', () => {
    render(
      <OutputsEditor
        outputs={[{ name: 'summary', prose: 'Severity.' }]}
        type={TransformType.Llm}
        columns={COLUMNS}
        isReady
        hasRefinement={false}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(`${AnalyticsPipelinesI18nKey.OutputProse} 1`, { exact: false })).toBeTruthy();
    expect(screen.queryByLabelText(AnalyticsPipelinesI18nKey.OutputRefinement)).toBeNull();
  });

  test('reports two outputs sharing a column, which the wire shape would collapse', () => {
    render(
      <Host
        type={TransformType.Llm}
        seed={[
          { name: 'summary', prose: 'first' },
          { name: 'summary', prose: 'second' },
        ]}
      />,
    );

    expect(screen.getAllByText(AnalyticsPipelinesI18nKey.OutputNameDuplicate).length).toBeGreaterThan(0);
  });
});

describe('OutputsEditor — the target column', () => {
  test('offers the target columns and excludes the provenance ones', () => {
    render(<Host type={TransformType.Llm} seed={[{ name: 'summary', prose: 'Severity.' }]} />);

    const options = optionValues(nameField());

    expect(options).toContain('topic');
    expect(options).not.toContain('pipeline_generation');
  });

  test('excludes a column another row already takes', () => {
    render(
      <Host
        type={TransformType.Llm}
        seed={[
          { name: 'summary', prose: 'first' },
          { name: 'topic', prose: 'second' },
        ]}
      />,
    );

    const [first] = screen.getAllByLabelText(AnalyticsPipelinesI18nKey.OutputColumn, { exact: false });

    expect(optionValues(first)).not.toContain('topic');
  });

  test('keeps a column the target no longer carries, marked rather than dropped', () => {
    render(<Host type={TransformType.Llm} seed={[{ name: 'retired_column', prose: 'Severity.' }]} />);

    expect(optionValues(nameField())).toContain('retired_column');
    expect(screen.getByText(AnalyticsPipelinesI18nKey.OutputColumnMissing)).toBeTruthy();
  });

  test('waits for the target rather than offering a select with nothing in it', () => {
    render(<OutputsEditor outputs={[]} type={TransformType.Llm} columns={[]} isReady={false} onChange={vi.fn()} />);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.TransformEmpty)).toBeTruthy();
    expect(screen.queryByRole('button', { name: AnalyticsPipelinesI18nKey.AddOutput })).toBeNull();
  });
});

describe('OutputsEditor — the column owns the domain and the description', () => {
  test('offers no value list for a column that declares its own enum domain', () => {
    render(<Host type={TransformType.Llm} seed={[{ name: 'risk_level', prose: 'Severity.' }]} />);

    expect(optionValues(screen.getByLabelText(AnalyticsPipelinesI18nKey.OutputRefinement))).not.toContain(
      OutputRefinementKind.Values,
    );
    expect(screen.getByText(/low, high/)).toBeTruthy();
  });

  test('offers the value list for a plain string column', () => {
    render(<Host type={TransformType.Llm} seed={[{ name: 'topic', prose: 'Topic.' }]} />);

    expect(optionValues(screen.getByLabelText(AnalyticsPipelinesI18nKey.OutputRefinement))).toContain(
      OutputRefinementKind.Values,
    );
  });

  test("shows the column's description as what an untouched prose will use", () => {
    render(<Host type={TransformType.Llm} seed={[{ name: 'summary' }]} />);

    expect(screen.getByLabelText(`${AnalyticsPipelinesI18nKey.OutputProse} 1`, { exact: false })).toHaveAttribute(
      'placeholder',
      'One-line summary of the session.',
    );
  });
});

describe('OutputsEditor — the identity transform', () => {
  // The service refuses it: an absent jsonata already means a direct lookup by that name.
  test('marks a transform that repeats the bound column name', () => {
    render(<Host type={TransformType.Llm} seed={[{ name: 'topic', prose: 'Topic.', jsonata: 'topic' }]} />);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.OutputJsonataIdentity)).toBeTruthy();
  });

  test('leaves a transform that reads the column differently unmarked', () => {
    render(<Host type={TransformType.Llm} seed={[{ name: 'topic', prose: 'Topic.', jsonata: 'topic_raw' }]} />);

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.OutputJsonataIdentity)).toBeNull();
  });
});

describe('OutputsEditor — a sql transform', () => {
  test('presents the expression alone, with no prose or refinement', () => {
    render(<Host type={TransformType.Sql} seed={[{ name: 'topic', sql: 'count(*)' }]} />);

    expect(screen.getByLabelText(`${AnalyticsPipelinesI18nKey.VarExpression} 1`, { exact: false })).toBeTruthy();
    expect(screen.queryByLabelText(`${AnalyticsPipelinesI18nKey.OutputProse} 1`, { exact: false })).toBeNull();
    expect(screen.queryByLabelText(AnalyticsPipelinesI18nKey.OutputRefinement)).toBeNull();
  });
});

describe('OutputsEditor — editing', () => {
  test('adds a row and publishes it', () => {
    render(<Host type={TransformType.Llm} />);

    fireEvent.click(addButton());

    expect(nameField()).toBeTruthy();
  });

  test('publishes the column a row is bound to', () => {
    const onChange = vi.fn();
    render(
      <OutputsEditor
        outputs={[{ name: 'summary', prose: 'Severity.' }]}
        type={TransformType.Llm}
        columns={COLUMNS}
        isReady
        onChange={onChange}
      />,
    );

    fireEvent.change(nameField(), { target: { value: 'topic' } });

    expect(onChange).toHaveBeenCalledWith([{ name: 'topic', prose: 'Severity.' }]);
  });

  test('removes the row it is asked to', () => {
    render(<Host type={TransformType.Llm} seed={[{ name: 'summary', prose: 'Severity.' }]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Buttons.Delete' }));

    expect(screen.queryByLabelText(AnalyticsPipelinesI18nKey.OutputColumn, { exact: false })).toBeNull();
  });

  test('states nothing about an empty list unless the caller asks for it', () => {
    const { rerender } = render(<Host type={TransformType.Llm} />);

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.NoOutputs)).toBeNull();

    rerender(
      <OutputsEditor
        outputs={[]}
        type={TransformType.Llm}
        columns={COLUMNS}
        isReady
        hasEmptyState
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText(AnalyticsPipelinesI18nKey.NoOutputs)).toBeTruthy();
  });
});
