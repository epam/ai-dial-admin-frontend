import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { TelemetryI18nKey } from '@/src/constants/i18n';

import CreateRunConditionFilter from '../CreateRunConditionFilter';
import { RunConditionFieldOption, RunConditionFilter, RunConditionLogicalOp, RunConditionOperator } from '../models';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@epam/ai-dial-ui-kit')>()),
  DialSelectField: ({ id, value, options, onChange }: any) => (
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} aria-label={id}>
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

const fieldOptions: RunConditionFieldOption[] = [
  { field: 'data::tags', displayName: 'tags', isArray: true },
  { field: 'data::filename', displayName: 'filename', isArray: false },
];

const baseDraft = (overrides?: Partial<RunConditionFilter>): RunConditionFilter => ({
  id: '1',
  field: 'data::filename',
  displayName: 'filename',
  isArray: false,
  logicalOp: RunConditionLogicalOp.And,
  predicates: [{ operator: RunConditionOperator.Equal, value: 'gpt' }],
  ...overrides,
});

const operatorLabels = () =>
  Array.from(screen.getByRole('combobox', { name: 'operator-0' }).querySelectorAll('option')).map(
    (option) => option.textContent,
  );

describe('CreateRunConditionFilter', () => {
  test('shows all four operators for a scalar field', () => {
    render(
      <CreateRunConditionFilter draft={baseDraft()} fieldOptions={fieldOptions} onChange={vi.fn()} onClear={vi.fn()} />,
    );

    expect(operatorLabels()).toEqual([
      TelemetryI18nKey.FilterConditionContain,
      TelemetryI18nKey.FilterConditionNotContain,
      TelemetryI18nKey.FilterConditionEqual,
      TelemetryI18nKey.FilterConditionNotEqual,
    ]);
  });

  test('shows only Contain and Not Contain for an array field', () => {
    render(
      <CreateRunConditionFilter
        draft={baseDraft({
          field: 'data::tags',
          displayName: 'tags',
          isArray: true,
          predicates: [{ operator: RunConditionOperator.Contain, value: 'a' }],
        })}
        fieldOptions={fieldOptions}
        onChange={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(operatorLabels()).toEqual([
      TelemetryI18nKey.FilterConditionContain,
      TelemetryI18nKey.FilterConditionNotContain,
    ]);
  });

  test('coerces Equal to Contain when switching to an array field', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <CreateRunConditionFilter
        draft={baseDraft()}
        fieldOptions={fieldOptions}
        onChange={onChange}
        onClear={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByRole('combobox', { name: 'run-condition-field' }), 'data::tags');

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        field: 'data::tags',
        isArray: true,
        predicates: [{ operator: RunConditionOperator.Contain, value: 'gpt' }],
      }),
    );
  });

  test('coerces a legacy Equal operator when opening an array draft', async () => {
    const onChange = vi.fn();

    render(
      <CreateRunConditionFilter
        draft={baseDraft({
          field: 'data::tags',
          displayName: 'tags',
          isArray: true,
          predicates: [{ operator: RunConditionOperator.Equal, value: 'a' }],
        })}
        fieldOptions={fieldOptions}
        onChange={onChange}
        onClear={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          predicates: [{ operator: RunConditionOperator.Contain, value: 'a' }],
        }),
      );
    });
  });
});
