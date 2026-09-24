import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';

import VariablesEditor from '@/src/components/Analytics/Pipelines/Enrich/VariablesEditor';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { PipelineVar } from '@/src/models/analytics/pipeline';
import { VarBindingKind } from '@/src/models/analytics/pipeline-ui';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';

// Swapped for a native select so the binding choice can be made the way a user makes it.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialSelectField: ({ id, options, value, invalid, onChange }: any) => (
      <select id={id} value={value} data-invalid={Boolean(invalid)} onChange={(e: any) => onChange(e.target.value)}>
        {options.map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    ),
  };
});

const columns: AnalyticsEntityField[] = [
  { source: 'request_body', name: 'dial_usage_log_payload.request_body', type: AnalyticsFieldType.String },
  { source: 'deployment', name: 'deployment', type: AnalyticsFieldType.String },
];

const Host = ({ seed = {} }: { seed?: Record<string, PipelineVar> }) => {
  const [vars, setVars] = useState<Record<string, PipelineVar>>(seed);
  return <VariablesEditor vars={vars} fields={columns} isReady onChange={setVars} />;
};

const nameField = (index = 1) =>
  screen.getByLabelText(`${AnalyticsPipelinesI18nKey.VarName} ${index}`, { exact: false });
const bindingSelect = (index = 1) =>
  screen.getByRole('group', { name: `${AnalyticsPipelinesI18nKey.VarBinding} ${index}` }).querySelector('select')!;

describe('VariablesEditor', () => {
  test('offers a qualified enrichment column and does not mark a binding to one', () => {
    render(<Host seed={{ request: { column: 'dial_usage_log_payload.request_body' } }} />);

    const [, valueSelect] = screen.getAllByRole('combobox');

    expect(Array.from(valueSelect.querySelectorAll('option')).map((option) => option.value)).toContain(
      'dial_usage_log_payload.request_body',
    );
    expect(valueSelect).toHaveAttribute('data-invalid', 'false');
  });

  test('still marks a binding to a field the entity does not carry', () => {
    render(<Host seed={{ request: { column: 'retired_column' } }} />);

    const [, valueSelect] = screen.getAllByRole('combobox');

    expect(valueSelect).toHaveAttribute('data-invalid', 'true');
    expect(Array.from(valueSelect.querySelectorAll('option')).map((option) => option.value)).toContain(
      'retired_column',
    );
  });

  test('states that the source could not be read, rather than that nothing is declared', () => {
    render(<VariablesEditor fields={[]} isReady={false} hasError onChange={vi.fn()} />);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.SourceFieldsLoadFailed)).toBeTruthy();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.VariablesEmpty)).toBeNull();
  });

  test('states that nothing can be bound until the read source resolves', () => {
    render(<VariablesEditor fields={columns} isReady={false} onChange={vi.fn()} />);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.VariablesEmpty)).toBeTruthy();
  });

  test('seeds a row per declared variable', () => {
    render(<Host seed={{ request: { column: 'dial_usage_log_payload.request_body' } }} />);

    expect(nameField()).toHaveValue('request');
    expect(bindingSelect()).toHaveValue(VarBindingKind.Column);
  });

  test('adds a row on demand', () => {
    render(<Host />);

    fireEvent.click(screen.getByRole('button', { name: AnalyticsPipelinesI18nKey.AddVariable }));

    expect(nameField()).toBeTruthy();
  });

  test('publishes the map keyed by name', () => {
    const onChange = vi.fn();
    render(
      <VariablesEditor
        vars={{ request: { column: 'dial_usage_log_payload.request_body' } }}
        fields={columns}
        isReady
        onChange={onChange}
      />,
    );

    fireEvent.change(nameField(), { target: { value: 'prompt' } });

    expect(onChange).toHaveBeenCalledWith({ prompt: { column: 'dial_usage_log_payload.request_body' } });
  });

  test('offers the column selector for a column binding and the expression field for a transform', () => {
    render(<Host seed={{ members: { jsonata: '$join(members)' } }} />);

    expect(bindingSelect()).toHaveValue(VarBindingKind.Jsonata);
    expect(screen.getByLabelText(`${AnalyticsPipelinesI18nKey.VarValue} 1`, { exact: false })).toHaveValue(
      '$join(members)',
    );
  });

  test('swaps the field when the binding changes, dropping the half the row no longer declares', () => {
    const onChange = vi.fn();
    render(
      <VariablesEditor
        vars={{ request: { column: 'dial_usage_log_payload.request_body' } }}
        fields={columns}
        isReady
        onChange={onChange}
      />,
    );

    fireEvent.change(bindingSelect(), { target: { value: VarBindingKind.Jsonata } });

    expect(onChange).toHaveBeenCalledWith({});
  });

  test('removes the row it is asked to', () => {
    render(<Host seed={{ request: { column: 'dial_usage_log_payload.request_body' } }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Buttons.Delete 1' }));

    expect(screen.queryByLabelText(`${AnalyticsPipelinesI18nKey.VarName} 1`, { exact: false })).toBeNull();
  });
});
