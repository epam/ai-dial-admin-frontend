import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { ArgumentTemplate as ArgumentTemplateModel, ToolRef } from '@/src/models/evaluation/test-suite';
import ArgumentTemplate from '../ArgumentTemplate';

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData }: { rowData: unknown[] }) => (
    <div data-testid="grid-view">
      {rowData.map((row: unknown, i: number) => (
        <div key={i} data-testid={`grid-row-${i}`}>
          {JSON.stringify(row)}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: ({ entity }: { entity: unknown }) => <div data-testid="json-editor">{JSON.stringify(entity)}</div>,
}));

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialSwitch: ({ label, isOn, onChange }: { label: string; isOn: boolean; onChange: () => void; switchId: string }) => (
    <button type="button" data-testid="json-toggle" onClick={onChange}>
      {label} {isOn ? 'on' : 'off'}
    </button>
  ),
}));

const baseToolRef: ToolRef = {
  name: 'search',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      limit: { type: 'integer' },
    },
    required: ['query'],
  },
};

const baseArgumentTemplate: ArgumentTemplateModel = {
  arguments: {
    query: '${{searchText}}',
    limit: 10,
  },
};

describe('ArgumentTemplate', () => {
  test('renders table from inputSchema properties', () => {
    render(<ArgumentTemplate toolRef={baseToolRef} argumentTemplate={baseArgumentTemplate} onChange={vi.fn()} />);

    expect(screen.getByTestId('grid-view')).toBeInTheDocument();
    expect(screen.getByTestId('grid-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('grid-row-1')).toBeInTheDocument();
  });

  test('shows empty state when no schema properties', () => {
    const emptyToolRef: ToolRef = {
      name: 'noop',
      inputSchema: { type: 'object' },
    };

    render(<ArgumentTemplate toolRef={emptyToolRef} argumentTemplate={{ arguments: {} }} onChange={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.NoArgumentsDefined)).toBeInTheDocument();
  });

  test('JSON toggle switches to JSON editor mode', async () => {
    render(<ArgumentTemplate toolRef={baseToolRef} argumentTemplate={baseArgumentTemplate} onChange={vi.fn()} />);

    const toggle = screen.getByTestId('json-toggle');
    fireEvent.click(toggle);

    expect(screen.getByTestId('json-editor')).toBeInTheDocument();
  });

  test('rows have correct mode: binding vs constant', () => {
    render(<ArgumentTemplate toolRef={baseToolRef} argumentTemplate={baseArgumentTemplate} onChange={vi.fn()} />);

    const row0 = screen.getByTestId('grid-row-0');
    expect(row0.textContent).toContain('"mode":"binding"');

    const row1 = screen.getByTestId('grid-row-1');
    expect(row1.textContent).toContain('"mode":"constant"');
  });

  test('object type field forced to constant mode', () => {
    const toolRef: ToolRef = {
      name: 'test',
      inputSchema: {
        type: 'object',
        properties: {
          config: { type: 'object' },
        },
      },
    };

    render(
      <ArgumentTemplate
        toolRef={toolRef}
        argumentTemplate={{ arguments: { config: { key: 'value' } } }}
        onChange={vi.fn()}
      />,
    );

    const row = screen.getByTestId('grid-row-0');
    expect(row.textContent).toContain('"mode":"constant"');
  });
});
