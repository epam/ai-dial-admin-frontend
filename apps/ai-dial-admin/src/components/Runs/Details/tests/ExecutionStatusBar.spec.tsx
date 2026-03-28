import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { ExtractionResultStatus } from '@/src/models/evaluation/run';
import ExecutionStatusBar from '../ExecutionStatusBar';

describe('ExecutionStatusBar', () => {
  test('Should render success status pill, HTTP code, duration and timestamp', () => {
    render(
      <ExecutionStatusBar
        status={ExtractionResultStatus.SUCCESS}
        httpCode={200}
        durationMs={10500}
        timestamp={1711457423000}
        timestampLabel="Started"
      />,
    );

    expect(screen.getByText(/SUCCESS/)).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('10.5s')).toBeInTheDocument();
  });

  test('Should render failed status pill', () => {
    render(<ExecutionStatusBar status={ExtractionResultStatus.FAILED} httpCode={500} durationMs={1200} />);

    expect(screen.getByText(/FAILED/)).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText('1.2s')).toBeInTheDocument();
  });

  test('Should show dash for missing fields', () => {
    render(<ExecutionStatusBar />);

    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  test('Should render Grafana link when URL provided', () => {
    render(
      <ExecutionStatusBar
        status={ExtractionResultStatus.SUCCESS}
        httpCode={200}
        grafanaUrl="https://grafana.example.com/trace/123"
      />,
    );

    expect(screen.getByText('Runs.GrafanaDetails')).toBeInTheDocument();
  });

  test('Should not render Grafana link when no URL', () => {
    render(<ExecutionStatusBar status={ExtractionResultStatus.SUCCESS} httpCode={200} />);

    expect(screen.queryByText('Runs.GrafanaDetails')).not.toBeInTheDocument();
  });
});
