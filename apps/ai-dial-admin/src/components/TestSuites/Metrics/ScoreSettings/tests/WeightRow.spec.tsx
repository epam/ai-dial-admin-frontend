import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, ErrorI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { OverallScoreWeight } from '@/src/models/evaluation/test-suite';
import WeightRow, { Props } from '../WeightRow';
import { MetricOutputOption } from '../models';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();

  return {
    ...actual,
    DialSelectField: ({ id, label, value, options, invalid, onChange }: any) => (
      <div>
        {label !== undefined && <label htmlFor={id}>{label}</label>}
        <select id={id} data-invalid={invalid} value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="" />
          {options?.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div>
          {options?.map((option: any) => (
            <span key={option.value}>{option.labelNode}</span>
          ))}
        </div>
      </div>
    ),
    DialNumberInput: ({ id, labelProps, value, invalid, onChange }: any) => (
      <div>
        {labelProps?.label !== undefined && <label htmlFor={id}>{labelProps.label}</label>}
        <input
          id={id}
          data-invalid={invalid}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value === '' ? undefined : event.target.value)}
        />
      </div>
    ),
    DialRemoveButton: ({ onClick, ...rest }: any) => <button type="button" onClick={onClick} {...rest} />,
  };
});

const availableOptions: MetricOutputOption[] = [
  { value: 'A::score', metricName: 'A', outputField: 'score', label: 'A — score' },
  { value: 'B::latency', metricName: 'B', outputField: 'latency', label: 'B — latency' },
];

const ControlledWeightRow = (
  props: Omit<Props, 'row' | 'onUpdate'> & { initialRow: OverallScoreWeight; onUpdate?: Props['onUpdate'] },
) => {
  const { initialRow, onUpdate, ...rest } = props;
  const [row, setRow] = useState(initialRow);

  const handleUpdate: Props['onUpdate'] = (nextRow, index) => {
    setRow(nextRow);
    onUpdate?.(nextRow, index);
  };

  return <WeightRow {...rest} row={row} onUpdate={handleUpdate} />;
};

describe('WeightRow', () => {
  test('renders the metric dropdown, weight input and remove button', () => {
    const row: OverallScoreWeight = { metricName: 'A', outputField: 'score', weight: 0.5 };

    render(<WeightRow index={0} row={row} availableOptions={availableOptions} onUpdate={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByLabelText(TestSuitesI18nKey.OverallScoreMetricLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(TestSuitesI18nKey.OverallScoreWeightLabel)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Remove })).toBeInTheDocument();
  });

  test('clicking remove calls onRemove with the row index', async () => {
    const onRemove = vi.fn();
    const row: OverallScoreWeight = { metricName: 'A', outputField: 'score', weight: 0.5 };

    render(
      <WeightRow index={2} row={row} availableOptions={availableOptions} onUpdate={vi.fn()} onRemove={onRemove} />,
    );
    await userEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Remove }));

    expect(onRemove).toHaveBeenCalledWith(2);
  });

  test('changing the weight calls onUpdate with the parsed numeric value', async () => {
    const onUpdate = vi.fn();
    const initialRow: OverallScoreWeight = { metricName: 'A', outputField: 'score', weight: 0.5 };

    render(
      <ControlledWeightRow
        index={0}
        initialRow={initialRow}
        availableOptions={availableOptions}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
      />,
    );

    const weightInput = screen.getByLabelText(TestSuitesI18nKey.OverallScoreWeightLabel);
    fireEvent.change(weightInput, { target: { value: '0.8' } });

    expect(onUpdate).toHaveBeenLastCalledWith({ ...initialRow, weight: 0.8 }, 0);
  });

  test('clearing the weight updates the row to an undefined weight', () => {
    const onUpdate = vi.fn();
    const initialRow: OverallScoreWeight = { metricName: 'A', outputField: 'score', weight: 0.5 };

    render(
      <ControlledWeightRow
        index={0}
        initialRow={initialRow}
        availableOptions={availableOptions}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
      />,
    );

    const weightInput = screen.getByLabelText(TestSuitesI18nKey.OverallScoreWeightLabel);
    fireEvent.change(weightInput, { target: { value: '' } });

    expect(onUpdate).toHaveBeenLastCalledWith({ ...initialRow, weight: undefined }, 0);
  });

  test('does not render labels on rows after the first', () => {
    const row: OverallScoreWeight = { metricName: 'A', outputField: 'score', weight: 0.5 };

    render(<WeightRow index={1} row={row} availableOptions={availableOptions} onUpdate={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.queryByLabelText(TestSuitesI18nKey.OverallScoreMetricLabel)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(TestSuitesI18nKey.OverallScoreWeightLabel)).not.toBeInTheDocument();
  });

  test('renders each metric option as metric-name and output-field spans', () => {
    const row: OverallScoreWeight = { metricName: '', outputField: '', weight: undefined as unknown as number };

    render(<WeightRow index={0} row={row} availableOptions={availableOptions} onUpdate={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByText('A.')).toHaveClass('text-secondary');
    expect(screen.getByText('score')).toBeInTheDocument();
    expect(screen.getByText('B.')).toHaveClass('text-secondary');
    expect(screen.getByText('latency')).toBeInTheDocument();
  });

  test('does not render error text while showing invalid weight state', () => {
    const row: OverallScoreWeight = { metricName: 'A', outputField: 'score', weight: NaN };

    render(<WeightRow index={0} row={row} availableOptions={availableOptions} onUpdate={vi.fn()} onRemove={vi.fn()} />);

    const weightInput = screen.getByLabelText(TestSuitesI18nKey.OverallScoreWeightLabel);

    expect(weightInput).toHaveAttribute('data-invalid', 'true');
    expect(screen.queryByText(ErrorI18nKey.EmptyField)).not.toBeInTheDocument();
  });

  test('marks the weight input invalid for a non-positive weight', () => {
    const row: OverallScoreWeight = { metricName: 'A', outputField: 'score', weight: 0 };

    render(<WeightRow index={0} row={row} availableOptions={availableOptions} onUpdate={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByLabelText(TestSuitesI18nKey.OverallScoreWeightLabel)).toHaveAttribute('data-invalid', 'true');
  });

  test('marks the metric dropdown invalid when the selected metric no longer exists', () => {
    const row: OverallScoreWeight = { metricName: 'Deleted', outputField: 'score', weight: 1 };

    render(<WeightRow index={0} row={row} availableOptions={availableOptions} onUpdate={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByLabelText(TestSuitesI18nKey.OverallScoreMetricLabel)).toHaveAttribute('data-invalid', 'true');
  });

  test('dispatches RemoveField for both fields on unmount', () => {
    const { dispatch } = useSaveValidationContext();
    const row: OverallScoreWeight = { metricName: 'A', outputField: 'score', weight: 0.5 };

    const { unmount } = render(
      <WeightRow index={3} row={row} availableOptions={availableOptions} onUpdate={vi.fn()} onRemove={vi.fn()} />,
    );

    vi.mocked(dispatch).mockClear();
    unmount();

    expect(dispatch).toHaveBeenCalledWith({ type: ValidationActionType.RemoveField, field: 'overallScoreMetric_3' });
    expect(dispatch).toHaveBeenCalledWith({ type: ValidationActionType.RemoveField, field: 'overallScoreWeight_3' });
  });
});
