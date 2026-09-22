import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';

import VariablesEditor from '@/src/components/Analytics/Pipelines/Enrich/VariablesEditor';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { PipelineVar } from '@/src/models/analytics/pipeline';
import { VarBindingKind } from '@/src/models/analytics/pipeline-ui';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';

// Swapped for a native select so the binding choice can be made the way a user makes it.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialSelectField: ({ id, options, value, onChange }: any) => (
      <select id={id} value={value} onChange={(e: any) => onChange(e.target.value)}>
        {options.map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    ),
  };
});

const columns: AnalyticsTableColumn[] = [
  { source_name: 'request_body', name: 'request_body', type: AnalyticsFieldType.String },
  { source_name: 'deployment', name: 'deployment', type: AnalyticsFieldType.String },
];

const Host = ({ seed = {} }: { seed?: Record<string, PipelineVar> }) => {
  const [vars, setVars] = useState<Record<string, PipelineVar>>(seed);
  return <VariablesEditor vars={vars} columns={columns} isReady onChange={setVars} />;
};

const nameField = (index = 1) =>
  screen.getByLabelText(`${AnalyticsPipelinesI18nKey.VarName} ${index}`, { exact: false });
const bindingSelect = (index = 1) =>
  screen.getByRole('group', { name: `${AnalyticsPipelinesI18nKey.VarBinding} ${index}` }).querySelector('select')!;

describe('VariablesEditor', () => {
  test('states that nothing can be bound until the read source resolves', () => {
    render(<VariablesEditor columns={columns} isReady={false} onChange={vi.fn()} />);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.VariablesEmpty)).toBeTruthy();
  });

  test('seeds a row per declared variable', () => {
    render(<Host seed={{ request: { column: 'request_body' } }} />);

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
      <VariablesEditor vars={{ request: { column: 'request_body' } }} columns={columns} isReady onChange={onChange} />,
    );

    fireEvent.change(nameField(), { target: { value: 'prompt' } });

    expect(onChange).toHaveBeenCalledWith({ prompt: { column: 'request_body' } });
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
      <VariablesEditor vars={{ request: { column: 'request_body' } }} columns={columns} isReady onChange={onChange} />,
    );

    fireEvent.change(bindingSelect(), { target: { value: VarBindingKind.Jsonata } });

    expect(onChange).toHaveBeenCalledWith({});
  });

  test('removes the row it is asked to', () => {
    render(<Host seed={{ request: { column: 'request_body' } }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Buttons.Delete 1' }));

    expect(screen.queryByLabelText(`${AnalyticsPipelinesI18nKey.VarName} 1`, { exact: false })).toBeNull();
  });
});
