import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { ExprType, QueryMode, StructuredQuery } from '@/src/models/evaluation/structured-query';
import { FunctionParameterSource, FunctionParameterSourceType, OverallScoreFunctionName } from '../models';
import SpecificFunction from '../SpecificFunction';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialSelectField: ({ id, label, value, options, onChange }: any) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock('../FunctionParameterRow', () => ({
  default: ({ labelKey, source, onChange }: any) => (
    <div>
      <span>{`row-${labelKey}-${source.$type}-${source.columnName ?? ''}`}</span>
      <button onClick={() => onChange({ $type: FunctionParameterSourceType.TestCase, columnName: 'updated' })}>
        {`update-${labelKey}`}
      </button>
    </div>
  ),
}));

const buildExpression = (parameterSources: FunctionParameterSource[]): StructuredQuery => ({
  entity: 'eval_summaries',
  mode: QueryMode.Aggregate,
  select: [
    {
      expr: {
        type: ExprType.Fn,
        name: OverallScoreFunctionName.RocAuc,
        args: parameterSources.map((source) => ({
          type: ExprType.Field,
          name: source.columnName ? `data::${source.columnName}` : '',
        })),
      },
      as: 'value',
    },
  ],
});

describe('SpecificFunction', () => {
  test('renders the panel title, function select preselected to roc auc, and both parameter rows', () => {
    const expression = buildExpression([
      { $type: FunctionParameterSourceType.TestCase, columnName: 'y_true_float' },
      { $type: FunctionParameterSourceType.TestCase, columnName: 'y_pred' },
    ]);

    render(<SpecificFunction expression={expression} onChange={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.OverallScoreFunction)).toBeInTheDocument();
    expect(screen.getByLabelText(TestSuitesI18nKey.OverallScoreFunctionLabel)).toHaveValue(
      OverallScoreFunctionName.RocAuc,
    );
    expect(screen.getByText(TestSuitesI18nKey.OverallScoreFunctionParameters)).toBeInTheDocument();
    expect(
      screen.getByText(
        `row-${TestSuitesI18nKey.OverallScoreDatasetColumn}-${FunctionParameterSourceType.TestCase}-y_true_float`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `row-${TestSuitesI18nKey.OverallScoreParameterP}-${FunctionParameterSourceType.TestCase}-y_pred`,
      ),
    ).toBeInTheDocument();
  });

  test('changing the function select calls onChange with the new function name and unchanged parameter sources', async () => {
    const onChange = vi.fn();
    const parameterSources = [
      { $type: FunctionParameterSourceType.TestCase, columnName: 'y_true_float' },
      { $type: FunctionParameterSourceType.TestCase, columnName: 'y_pred' },
    ];
    const expression = buildExpression(parameterSources);

    render(<SpecificFunction expression={expression} onChange={onChange} />);

    await userEvent.selectOptions(
      screen.getByLabelText(TestSuitesI18nKey.OverallScoreFunctionLabel),
      OverallScoreFunctionName.RocAuc,
    );

    expect(onChange).toHaveBeenCalledWith(OverallScoreFunctionName.RocAuc, parameterSources);
  });

  test('updating the first parameter row propagates the change at index 0, leaving index 1 untouched', async () => {
    const onChange = vi.fn();
    const parameterSources = [
      { $type: FunctionParameterSourceType.TestCase, columnName: 'y_true_float' },
      { $type: FunctionParameterSourceType.TestCase, columnName: 'y_pred' },
    ];
    const expression = buildExpression(parameterSources);

    render(<SpecificFunction expression={expression} onChange={onChange} />);

    await userEvent.click(
      screen.getByRole('button', { name: `update-${TestSuitesI18nKey.OverallScoreDatasetColumn}` }),
    );

    expect(onChange).toHaveBeenCalledWith(OverallScoreFunctionName.RocAuc, [
      { $type: FunctionParameterSourceType.TestCase, columnName: 'updated' },
      parameterSources[1],
    ]);
  });

  test('updating the second parameter row propagates the change at index 1, leaving index 0 untouched', async () => {
    const onChange = vi.fn();
    const parameterSources = [
      { $type: FunctionParameterSourceType.TestCase, columnName: 'y_true_float' },
      { $type: FunctionParameterSourceType.TestCase, columnName: 'y_pred' },
    ];
    const expression = buildExpression(parameterSources);

    render(<SpecificFunction expression={expression} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: `update-${TestSuitesI18nKey.OverallScoreParameterP}` }));

    expect(onChange).toHaveBeenCalledWith(OverallScoreFunctionName.RocAuc, [
      parameterSources[0],
      { $type: FunctionParameterSourceType.TestCase, columnName: 'updated' },
    ]);
  });
});
