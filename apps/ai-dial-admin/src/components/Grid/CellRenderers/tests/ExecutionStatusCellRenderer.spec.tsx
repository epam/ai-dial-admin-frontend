import type { ICellRendererParams } from 'ag-grid-community';
import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { ExtractionResultStatus } from '@/src/models/evaluation/run';
import ExecutionStatusCellRenderer from '../ExecutionStatusCellRenderer';

const makeParams = (data: Record<string, unknown>): ICellRendererParams => ({ data }) as unknown as ICellRendererParams;

const renderStatus = (data: Record<string, unknown>) => render(<>{ExecutionStatusCellRenderer(makeParams(data))}</>);

describe('ExecutionStatusCellRenderer', () => {
  test('renders success icon with success class', () => {
    const { container } = renderStatus({ executionInfo: { status: ExtractionResultStatus.SUCCESS } });

    expect(container.querySelector('svg.text-success.shrink-0')).toBeInTheDocument();
  });

  test('renders failed icon with error class', () => {
    const { container } = renderStatus({ executionInfo: { status: ExtractionResultStatus.FAILED } });

    expect(container.querySelector('svg.text-error.shrink-0')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('—');
  });

  test('renders timeout icon with warning class', () => {
    const { container } = renderStatus({ executionInfo: { status: ExtractionResultStatus.TIMEOUT } });

    expect(container.querySelector('svg.text-warning.shrink-0')).toBeInTheDocument();
  });

  test('renders dash for error status', () => {
    const { container } = renderStatus({ executionInfo: { status: ExtractionResultStatus.ERROR } });

    expect(container).toHaveTextContent('—');
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  test('renders dash when status is missing', () => {
    const { container } = renderStatus({ executionInfo: {} });

    expect(container).toHaveTextContent('—');
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  test('renders success icon from AnalyticsResult executionStatus', () => {
    const { container } = renderStatus({ executionStatus: ExtractionResultStatus.SUCCESS });

    expect(container.querySelector('svg.text-success.shrink-0')).toBeInTheDocument();
  });

  test('renders failed icon from AnalyticsResult executionStatus', () => {
    const { container } = renderStatus({ executionStatus: ExtractionResultStatus.FAILED });

    expect(container.querySelector('svg.text-error.shrink-0')).toBeInTheDocument();
    expect(container).not.toHaveTextContent('—');
  });

  test('renders dash from AnalyticsResult error executionStatus', () => {
    const { container } = renderStatus({ executionStatus: ExtractionResultStatus.ERROR });

    expect(container).toHaveTextContent('—');
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  test('prefers executionInfo.status over executionStatus', () => {
    const { container } = renderStatus({
      executionInfo: { status: ExtractionResultStatus.TIMEOUT },
      executionStatus: ExtractionResultStatus.SUCCESS,
    });

    expect(container.querySelector('svg.text-warning.shrink-0')).toBeInTheDocument();
  });

  test('renders dash when neither executionInfo nor executionStatus is present', () => {
    const { container } = renderStatus({});

    expect(container).toHaveTextContent('—');
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
