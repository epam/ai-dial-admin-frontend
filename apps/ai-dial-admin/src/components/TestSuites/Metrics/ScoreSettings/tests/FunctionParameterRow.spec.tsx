import { useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { Metric } from '@/src/models/evaluation/metric';
import { ResponseColumn, TestCaseSchema } from '@/src/models/evaluation/test-suite';
import FunctionParameterRow from '../FunctionParameterRow';
import { FunctionParameterSource, FunctionParameterSourceType } from '../models';
import { buildFunctionParameterFieldName, parseFunctionParameterFieldName } from '../utils';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialLabel: ({ label }: any) => <span>{label}</span>,
  DialSelect: ({ options, value, searchable, onChange }: any) => (
    <>
      <select
        role="combobox"
        data-searchable={String(!!searchable)}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" />
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {options.map((option: any) => (
        <span key={option.value}>{option.labelNode ?? option.label}</span>
      ))}
    </>
  ),
}));

vi.mock('@/src/components/Common/TabSelector/TabSelector', () => ({
  default: ({ tabs, activeTab, onChange }: any) => (
    <div>
      {tabs.map((tab: any) => (
        <button key={tab.id} type="button" data-active={String(activeTab === tab.id)} onClick={() => onChange(tab.id)}>
          {tab.label}
        </button>
      ))}
    </div>
  ),
}));

const testCaseSchema: TestCaseSchema[] = [{ name: 'y_true_float', type: 'number' } as TestCaseSchema];
const responseColumns: ResponseColumn[] = [{ name: 'y_pred', displayName: 'Y pred', expression: '', type: 'number' }];
const metrics: Metric[] = [
  { name: 'Classifier', outputSchema: { type: 'object', properties: { score: { type: 'number' } } } },
];

describe('FunctionParameterRow', () => {
  test('renders the label and tabs', () => {
    const source: FunctionParameterSource = { $type: FunctionParameterSourceType.TestCase };

    render(
      <FunctionParameterRow
        labelKey={TestSuitesI18nKey.OverallScoreDatasetColumn}
        source={source}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText(TestSuitesI18nKey.OverallScoreDatasetColumn)).toBeInTheDocument();
    expect(screen.getByText(TabsI18nKey.TestCases)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.ResponseColumn)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.Metric)).toBeInTheDocument();
  });

  test('renders the test-case dropdown and selecting a column updates the source', async () => {
    const onChange = vi.fn();
    const source: FunctionParameterSource = { $type: FunctionParameterSourceType.TestCase };

    render(
      <FunctionParameterRow
        labelKey={TestSuitesI18nKey.OverallScoreDatasetColumn}
        source={source}
        testCaseSchema={testCaseSchema}
        onChange={onChange}
      />,
    );

    const user = userEvent.setup();
    await user.selectOptions(screen.getByRole('combobox'), 'y_true_float');

    expect(onChange).toHaveBeenCalledWith({ $type: FunctionParameterSourceType.TestCase, columnName: 'y_true_float' });
    expect(screen.getByRole('combobox')).toHaveAttribute('data-searchable', 'true');
  });

  test('renders the response dropdown and selecting a column updates the source', async () => {
    const onChange = vi.fn();
    const source: FunctionParameterSource = { $type: FunctionParameterSourceType.Response };

    render(
      <FunctionParameterRow
        labelKey={TestSuitesI18nKey.OverallScoreParameterP}
        source={source}
        responseColumns={responseColumns}
        onChange={onChange}
      />,
    );

    const user = userEvent.setup();
    await user.selectOptions(screen.getByRole('combobox'), 'y_pred');

    expect(onChange).toHaveBeenCalledWith({ $type: FunctionParameterSourceType.Response, columnName: 'y_pred' });
    expect(screen.getByRole('combobox')).toHaveAttribute('data-searchable', 'true');
  });

  test('renders the metric dropdown with metric-and-field option labels and selecting an option updates the source', async () => {
    const onChange = vi.fn();
    const source: FunctionParameterSource = { $type: FunctionParameterSourceType.Metric };

    render(
      <FunctionParameterRow
        labelKey={TestSuitesI18nKey.OverallScoreParameterP}
        source={source}
        metrics={metrics}
        onChange={onChange}
      />,
    );

    expect(screen.getByText('Classifier.')).toBeInTheDocument();
    expect(screen.getByText('score')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAttribute('data-searchable', 'true');

    const user = userEvent.setup();
    await user.selectOptions(screen.getByRole('combobox'), 'Classifier::score');

    expect(onChange).toHaveBeenCalledWith({
      $type: FunctionParameterSourceType.Metric,
      metricName: 'Classifier',
      outputField: 'score',
    });
  });

  test('switching tabs clears the previous selection', async () => {
    const onChange = vi.fn();
    const source: FunctionParameterSource = { $type: FunctionParameterSourceType.TestCase, columnName: 'y_true_float' };

    render(
      <FunctionParameterRow
        labelKey={TestSuitesI18nKey.OverallScoreDatasetColumn}
        source={source}
        testCaseSchema={testCaseSchema}
        responseColumns={responseColumns}
        onChange={onChange}
      />,
    );

    await userEvent.click(screen.getByText(TestSuitesI18nKey.ResponseColumn));

    expect(onChange).toHaveBeenCalledWith({ $type: FunctionParameterSourceType.Response });
  });

  test('a tab switch with no value chosen yet stays selected after the source round-trips through field-name serialization', async () => {
    const onChangeSpy = vi.fn();

    const Wrapper = () => {
      const [source, setSource] = useState<FunctionParameterSource>({
        $type: FunctionParameterSourceType.TestCase,
        columnName: 'y_true_float',
      });

      const onChange = (next: FunctionParameterSource) => {
        onChangeSpy(next);
        setSource(parseFunctionParameterFieldName(buildFunctionParameterFieldName(next)));
      };

      return (
        <FunctionParameterRow
          labelKey={TestSuitesI18nKey.OverallScoreDatasetColumn}
          source={source}
          testCaseSchema={testCaseSchema}
          responseColumns={responseColumns}
          metrics={metrics}
          onChange={onChange}
        />
      );
    };

    render(<Wrapper />);

    await userEvent.click(screen.getByText(TestSuitesI18nKey.ResponseColumn));

    expect(onChangeSpy).toHaveBeenCalledWith({ $type: FunctionParameterSourceType.Response });
    expect(screen.getByText(TestSuitesI18nKey.ResponseColumn).closest('button')).toHaveAttribute('data-active', 'true');
    expect(screen.getByText(TabsI18nKey.TestCases).closest('button')).toHaveAttribute('data-active', 'false');
  });
});
