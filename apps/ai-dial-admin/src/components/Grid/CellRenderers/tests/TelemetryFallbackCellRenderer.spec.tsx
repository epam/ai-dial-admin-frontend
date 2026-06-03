import { render, screen } from '@testing-library/react';
import type { ICellRendererParams } from 'ag-grid-community';
import type { ReactNode } from 'react';
import { describe, expect, test } from 'vitest';
import { vi } from 'vitest';

import TelemetryFallbackCellRenderer from '../TelemetryFallbackCellRenderer';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialTooltip: ({
      children,
      tooltip,
      triggerClassName,
    }: {
      children: ReactNode;
      tooltip?: ReactNode;
      triggerClassName?: string;
    }) => (
      <span className={triggerClassName}>
        {children}
        <span data-testid="tooltip-content">{tooltip}</span>
      </span>
    ),
  };
});

const params = (over: Partial<ICellRendererParams> & { tooltip?: string }): ICellRendererParams =>
  over as unknown as ICellRendererParams;

describe('TelemetryFallbackCellRenderer', () => {
  test('renders the value as-is and no info icon when value is present', () => {
    const { container } = render(
      <TelemetryFallbackCellRenderer
        {...params({ value: 'My Project', valueFormatted: 'My Project', tooltip: 'Called outside of any project' })}
      />,
    );
    expect(screen.getByText('My Project')).toBeInTheDocument();
    expect(container.querySelector('.text-secondary')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tooltip-content')).toBeNull();
  });

  test('renders the fallback label + info tooltip when value is empty', () => {
    const { container } = render(
      <TelemetryFallbackCellRenderer
        {...params({ value: '', valueFormatted: 'No Project', tooltip: 'Called outside of any project' })}
      />,
    );
    expect(screen.getByText('No Project')).toBeInTheDocument();
    expect(container.querySelector('.text-secondary')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent('Called outside of any project');
  });

  test('treats the literal string "undefined" as missing', () => {
    const { container } = render(
      <TelemetryFallbackCellRenderer
        {...params({
          value: 'undefined',
          valueFormatted: 'Direct call',
          tooltip: 'Called directly via Try out - no parent deployment',
        })}
      />,
    );
    expect(screen.getByText('Direct call')).toBeInTheDocument();
    expect(container.querySelector('.text-secondary')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(
      'Called directly via Try out - no parent deployment',
    );
  });
});
