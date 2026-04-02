import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { ArgumentTemplate as ArgumentTemplateModel, ToolRef } from '@/src/models/evaluation/test-suite';
import ArgumentTemplate from '../ArgumentTemplate';

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({
    onGridReady,
    getIsEmptyData,
  }: {
    onGridReady?: (e: unknown) => void;
    getIsEmptyData?: () => boolean;
  }) => {
    const isEmpty = getIsEmptyData?.() ?? true;
    if (isEmpty) return <div data-testid="grid-empty">Empty</div>;
    return <div data-testid="grid-view">Grid rendered</div>;
  },
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
    limit: '10',
  },
};

describe('ArgumentTemplate', () => {
  test('renders grid when inputSchema has properties', () => {
    render(<ArgumentTemplate toolRef={baseToolRef} argumentTemplate={baseArgumentTemplate} onChange={vi.fn()} />);

    expect(screen.getByTestId('grid-view')).toBeInTheDocument();
  });

  test('shows empty state when no schema properties', () => {
    const emptyToolRef: ToolRef = {
      name: 'noop',
      inputSchema: { type: 'object' },
    };

    render(<ArgumentTemplate toolRef={emptyToolRef} argumentTemplate={{ arguments: {} }} onChange={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.NoArgumentsDefined)).toBeInTheDocument();
  });

  test('renders Tool Arguments heading', () => {
    render(<ArgumentTemplate toolRef={baseToolRef} argumentTemplate={baseArgumentTemplate} onChange={vi.fn()} />);

    expect(screen.getByText(TestSuitesI18nKey.ToolArguments)).toBeInTheDocument();
  });
});
