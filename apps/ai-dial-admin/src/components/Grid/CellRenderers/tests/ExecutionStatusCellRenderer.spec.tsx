import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { ExtractionResultStatus } from '@/src/models/evaluation/run';
import ExecutionStatusCellRenderer from '../ExecutionStatusCellRenderer';

describe('ExecutionStatusCellRenderer', () => {
  test('renders success icon with success class', () => {
    const { container } = render(
      <ExecutionStatusCellRenderer data={{ executionInfo: { status: ExtractionResultStatus.SUCCESS } }} />,
    );

    expect(container.querySelector('svg.text-success.shrink-0')).toBeInTheDocument();
  });

  test('renders failed icon with error class', () => {
    const { container } = render(
      <ExecutionStatusCellRenderer data={{ executionInfo: { status: ExtractionResultStatus.FAILED } }} />,
    );

    expect(container.querySelector('svg.text-error.shrink-0')).toBeInTheDocument();
  });

  test('renders timeout icon with warning class', () => {
    const { container } = render(
      <ExecutionStatusCellRenderer data={{ executionInfo: { status: ExtractionResultStatus.TIMEOUT } }} />,
    );

    expect(container.querySelector('svg.text-warning.shrink-0')).toBeInTheDocument();
  });

  test('renders error icon with error class', () => {
    const { container } = render(
      <ExecutionStatusCellRenderer data={{ executionInfo: { status: ExtractionResultStatus.ERROR } }} />,
    );

    expect(container.querySelector('svg.text-error.shrink-0')).toBeInTheDocument();
  });

  test('renders nothing when status is missing', () => {
    const { container } = render(<ExecutionStatusCellRenderer data={{ executionInfo: {} }} />);

    expect(container.firstChild).toBeNull();
  });

  test('renders success icon from AnalyticsResult executionStatus', () => {
    const { container } = render(
      <ExecutionStatusCellRenderer data={{ executionStatus: ExtractionResultStatus.SUCCESS }} />,
    );

    expect(container.querySelector('svg.text-success.shrink-0')).toBeInTheDocument();
  });

  test('renders error icon from AnalyticsResult executionStatus', () => {
    const { container } = render(
      <ExecutionStatusCellRenderer data={{ executionStatus: ExtractionResultStatus.ERROR }} />,
    );

    expect(container.querySelector('svg.text-error.shrink-0')).toBeInTheDocument();
  });

  test('prefers executionInfo.status over executionStatus', () => {
    const { container } = render(
      <ExecutionStatusCellRenderer
        data={{
          executionInfo: { status: ExtractionResultStatus.TIMEOUT },
          executionStatus: ExtractionResultStatus.SUCCESS,
        }}
      />,
    );

    expect(container.querySelector('svg.text-warning.shrink-0')).toBeInTheDocument();
  });

  test('renders nothing when neither executionInfo nor executionStatus is present', () => {
    const { container } = render(<ExecutionStatusCellRenderer data={{}} />);

    expect(container.firstChild).toBeNull();
  });
});
