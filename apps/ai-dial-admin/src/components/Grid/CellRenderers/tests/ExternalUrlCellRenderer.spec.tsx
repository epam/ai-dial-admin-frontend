import { ICellRendererParams } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ExternalUrlCellRenderer from '../ExternalUrlCellRenderer';

const makeParams = (value: unknown): ICellRendererParams =>
  ({
    value,
  }) as unknown as ICellRendererParams;

describe('ExternalUrlCellRenderer', () => {
  test('renders anchor for valid URL', () => {
    render(<ExternalUrlCellRenderer {...makeParams('https://github.com/example/repo')} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://github.com/example/repo');
  });

  test('renders plain text for invalid URL', () => {
    render(<ExternalUrlCellRenderer {...makeParams('not-a-url')} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('not-a-url')).toBeInTheDocument();
  });

  test('renders nothing for falsy value', () => {
    const { container } = render(<ExternalUrlCellRenderer {...makeParams(undefined)} />);
    expect(container).toBeEmptyDOMElement();
  });
});
