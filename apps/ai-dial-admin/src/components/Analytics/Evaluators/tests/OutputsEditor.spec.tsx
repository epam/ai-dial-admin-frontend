import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';

import OutputsEditor from '@/src/components/Analytics/Evaluators/OutputsEditor';
import { AnalyticsEvaluatorsI18nKey } from '@/src/constants/i18n';
import { EvaluatorOutput, EvaluatorType } from '@/src/models/analytics/evaluator';
import { OutputRefinementKind } from '@/src/models/analytics/evaluator-ui';

// Swapped for a native select so the refinement choice can be made the way a user makes it.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialSelectField: ({ id, label, options, value, onChange }: any) => (
      <label>
        <span>{label}</span>
        <select id={id} aria-label={label} value={value} onChange={(e: any) => onChange(e.target.value)}>
          {options.map((o: any) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    ),
  };
});

// The editor is controlled: it publishes rows and is re-seeded from what it published, so a host holding
// the state is what exercises it the way the forms do.
const Host = ({ type, seed = [] }: { type: EvaluatorType; seed?: EvaluatorOutput[] }) => {
  const [outputs, setOutputs] = useState<EvaluatorOutput[]>(seed);
  return <OutputsEditor outputs={outputs} type={type} onChange={setOutputs} />;
};

const addButton = () => screen.getByRole('button', { name: AnalyticsEvaluatorsI18nKey.AddOutput });
const nameField = (index = 1) =>
  screen.getByLabelText(`${AnalyticsEvaluatorsI18nKey.VarName} ${index}`, { exact: false });

describe('OutputsEditor — an llm evaluator', () => {
  test('presents prose and, for an output declaring no refinement, an empty transform', () => {
    render(<Host type={EvaluatorType.Llm} seed={[{ name: 'risk', prose: 'Severity.' }]} />);

    expect(screen.getByLabelText(`${AnalyticsEvaluatorsI18nKey.OutputProse} 1`, { exact: false })).toBeTruthy();
    expect(screen.getByLabelText(AnalyticsEvaluatorsI18nKey.OutputRefinement)).toBeTruthy();
    expect(screen.getByLabelText(`${AnalyticsEvaluatorsI18nKey.OutputJsonata} 1`, { exact: false })).toHaveValue('');
    expect(screen.queryByRole('group', { name: `${AnalyticsEvaluatorsI18nKey.OutputValues} 1` })).toBeNull();
  });

  test('sends nothing for a transform left empty', () => {
    const onChange = vi.fn();
    render(
      <OutputsEditor outputs={[{ name: 'risk', prose: 'Severity.' }]} type={EvaluatorType.Llm} onChange={onChange} />,
    );

    fireEvent.change(nameField(), { target: { value: 'risk_level' } });

    expect(onChange).toHaveBeenCalledWith([{ name: 'risk_level', prose: 'Severity.' }]);
  });

  test('states that the order is the order the model answers in', () => {
    render(<Host type={EvaluatorType.Llm} seed={[{ name: 'risk', prose: 'Severity.' }]} />);

    expect(screen.getByText(AnalyticsEvaluatorsI18nKey.OutputsOrderHint)).toBeTruthy();
  });

  test('shows the field the stored refinement names, and only that one', () => {
    render(<Host type={EvaluatorType.Llm} seed={[{ name: 'risk', prose: 'Severity.', values: ['low'] }]} />);

    expect(screen.getByRole('group', { name: `${AnalyticsEvaluatorsI18nKey.OutputValues} 1` })).toBeTruthy();
    expect(screen.queryByLabelText(`${AnalyticsEvaluatorsI18nKey.OutputJsonata} 1`, { exact: false })).toBeNull();
  });

  test('swaps the field when the selection changes, keeping what the other holds out of the declaration', () => {
    const onChange = vi.fn();
    render(
      <OutputsEditor
        outputs={[{ name: 'risk', prose: 'Severity.', values: ['low'] }]}
        type={EvaluatorType.Llm}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText(AnalyticsEvaluatorsI18nKey.OutputRefinement), {
      target: { value: OutputRefinementKind.Jsonata },
    });

    expect(onChange).toHaveBeenCalledWith([{ name: 'risk', prose: 'Severity.' }]);
  });

  test('leaves the refinement out when the caller asks for the required members only', () => {
    render(
      <OutputsEditor
        outputs={[{ name: 'risk', prose: 'Severity.' }]}
        type={EvaluatorType.Llm}
        hasRefinement={false}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(`${AnalyticsEvaluatorsI18nKey.OutputProse} 1`, { exact: false })).toBeTruthy();
    expect(screen.queryByLabelText(AnalyticsEvaluatorsI18nKey.OutputRefinement)).toBeNull();
    expect(screen.queryByLabelText(`${AnalyticsEvaluatorsI18nKey.OutputJsonata} 1`, { exact: false })).toBeNull();
  });

  test('reports two outputs sharing a name, which the wire shape would collapse', () => {
    render(
      <Host
        type={EvaluatorType.Llm}
        seed={[
          { name: 'risk', prose: 'first' },
          { name: 'risk', prose: 'second' },
        ]}
      />,
    );

    expect(screen.getAllByText(AnalyticsEvaluatorsI18nKey.OutputNameDuplicate).length).toBeGreaterThan(0);
  });
});

describe('OutputsEditor — a sql evaluator', () => {
  test('presents the expression alone, with no prose or refinement', () => {
    render(<Host type={EvaluatorType.Sql} seed={[{ name: 'total', sql: 'count(*)' }]} />);

    expect(screen.getByLabelText(`${AnalyticsEvaluatorsI18nKey.VarExpression} 1`, { exact: false })).toBeTruthy();
    expect(screen.queryByLabelText(`${AnalyticsEvaluatorsI18nKey.OutputProse} 1`, { exact: false })).toBeNull();
    expect(screen.queryByLabelText(`${AnalyticsEvaluatorsI18nKey.OutputValues} 1`, { exact: false })).toBeNull();
  });
});

describe('OutputsEditor — editing', () => {
  test('adds a row and publishes it', () => {
    render(<Host type={EvaluatorType.Llm} />);

    fireEvent.click(addButton());

    expect(nameField()).toBeTruthy();
  });

  test('renders the entries in the order the version declares, which is the order the model answers in', () => {
    render(
      <Host
        type={EvaluatorType.Llm}
        seed={[
          { name: 'summary', prose: 'first' },
          { name: 'risk_level', prose: 'second' },
        ]}
      />,
    );

    const names = screen.getAllByRole('textbox').map((field) => (field as HTMLInputElement).value);

    expect(names[0]).toBe('summary');
    expect(names.indexOf('risk_level')).toBeGreaterThan(names.indexOf('summary'));
  });

  test('removes the row it is asked to', () => {
    render(<Host type={EvaluatorType.Llm} seed={[{ name: 'risk', prose: 'Severity.' }]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Buttons.Delete' }));

    expect(screen.queryByLabelText(`${AnalyticsEvaluatorsI18nKey.VarName} 1`, { exact: false })).toBeNull();
  });

  test('publishes an edited name', () => {
    const onChange = vi.fn();
    render(
      <OutputsEditor outputs={[{ name: 'risk', prose: 'Severity.' }]} type={EvaluatorType.Llm} onChange={onChange} />,
    );

    fireEvent.change(nameField(), { target: { value: 'risk_level' } });

    expect(onChange).toHaveBeenCalledWith([{ name: 'risk_level', prose: 'Severity.' }]);
  });

  test('states nothing about an empty list unless the caller asks for it', () => {
    const { rerender } = render(<Host type={EvaluatorType.Llm} />);

    expect(screen.queryByText(AnalyticsEvaluatorsI18nKey.NoOutputVars)).toBeNull();

    rerender(<OutputsEditor outputs={[]} type={EvaluatorType.Llm} hasEmptyState onChange={vi.fn()} />);

    expect(screen.getByText(AnalyticsEvaluatorsI18nKey.NoOutputVars)).toBeTruthy();
  });
});
