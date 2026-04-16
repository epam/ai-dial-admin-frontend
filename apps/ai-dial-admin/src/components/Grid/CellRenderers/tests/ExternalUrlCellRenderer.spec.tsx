import { ICellRendererParams } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ExternalUrlCellRenderer from '../ExternalUrlCellRenderer';

const makeParams = (value: unknown): ICellRendererParams =>
  ({
    value,
  }) as unknown as ICellRendererParams;

describe('ExternalUrlCellRenderer', () => {
  test('renders anchor for valid HTTPS URL', () => {
    const { container } = render(<ExternalUrlCellRenderer {...makeParams('https://github.com/example/repo')} />);
    const link = screen.getByRole('link', { name: /https:\/\/github\.com\/example\/repo/ });
    expect(link).toHaveAttribute('href', 'https://github.com/example/repo');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('renders anchor for valid HTTP URL', () => {
    render(<ExternalUrlCellRenderer {...makeParams('http://example.com')} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', 'http://example.com');
  });

  test('renders plain text for invalid URL', () => {
    render(<ExternalUrlCellRenderer {...makeParams('not-a-url')} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('not-a-url')).toBeInTheDocument();
  });

  test('renders nothing for empty string value', () => {
    const { container } = render(<ExternalUrlCellRenderer {...makeParams('')} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders nothing for undefined value', () => {
    const { container } = render(<ExternalUrlCellRenderer {...makeParams(undefined)} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders nothing for null value', () => {
    const { container } = render(<ExternalUrlCellRenderer {...makeParams(null)} />);
    expect(container).toBeEmptyDOMElement();
  });
});
