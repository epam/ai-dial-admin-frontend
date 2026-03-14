import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { Metric } from '@/src/models/evaluation/metric';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import Bindings from '../Bindings';

vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string) => key,
}));

let mockOnGridReady: (event: { api: { updateGridOptions: ReturnType<typeof vi.fn> } }) => void;

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ getIsEmptyData, emptyDataProps, onGridReady }: any) => {
    mockOnGridReady = onGridReady;
    return (
      <div role="grid" aria-label="bindings-grid">
        {getIsEmptyData() ? (
          <div role="status" aria-label={emptyDataProps?.title}>
            {emptyDataProps?.title}
          </div>
        ) : (
          <div>Grid with data</div>
        )}
      </div>
    );
  },
}));

describe('Bindings', () => {
  const selectedMetric: Metric = {
    id: 'metric-1',
    name: 'Test Metric',
    configBindings: [],
    inputBindings: [],
    metricDeclarationVersion: {
      configSchema: { type: 'object', properties: {} },
      inputSchema: { type: 'object', properties: {} },
    },
  };

  const selectedTestSuite: TestSuite = {
    testCaseSchema: [],
    responseColumns: [],
  };

  const onChange = vi.fn();

  test('renders bindings heading and grid', () => {
    render(
      <Bindings
        selectedMetric={selectedMetric}
        selectedTestSuite={selectedTestSuite}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('heading', { name: TestSuitesI18nKey.Bindings })).toBeInTheDocument();
  });

  test('renders grid', () => {
    render(
      <Bindings
        selectedMetric={selectedMetric}
        selectedTestSuite={selectedTestSuite}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('grid', { name: 'bindings-grid' })).toBeInTheDocument();
  });

  test('shows empty state when no bindings data', () => {
    render(
      <Bindings
        selectedMetric={selectedMetric}
        selectedTestSuite={selectedTestSuite}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('status', { name: BasicI18nKey.NoVariables })).toBeInTheDocument();
  });

  test('calls onGridReady when grid mounts', () => {
    const updateGridOptions = vi.fn();
    render(
      <Bindings
        selectedMetric={selectedMetric}
        selectedTestSuite={selectedTestSuite}
        onChange={onChange}
      />,
    );

    expect(mockOnGridReady).toBeDefined();
    mockOnGridReady({ api: { updateGridOptions } });

    expect(updateGridOptions).toHaveBeenCalled();
  });
});
