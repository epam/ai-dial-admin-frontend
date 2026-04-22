import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ExternalLink from '../ExternalLink';

describe('ExternalLink', () => {
  test('renders anchor for valid HTTPS URL', () => {
    const { container } = render(<ExternalLink value="https://github.com/example/repo" />);
    const link = screen.getByRole('link', { name: /https:\/\/github\.com\/example\/repo/ });
    expect(link).toHaveAttribute('href', 'https://github.com/example/repo');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  test('renders anchor for valid HTTP URL', () => {
    render(<ExternalLink value="http://example.com" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', 'http://example.com');
  });

  test('renders span with plain text for invalid URL', () => {
    render(<ExternalLink value="not-a-url" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('not-a-url')).toBeInTheDocument();
  });

  test('renders nothing for undefined value', () => {
    const { container } = render(<ExternalLink value={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders nothing for empty string value', () => {
    const { container } = render(<ExternalLink value="" />);
    expect(container).toBeEmptyDOMElement();
  });

  test('applies className to the link variant', () => {
    const { container } = render(<ExternalLink value="https://example.com" className="custom" />);
    expect(container.querySelector('a.custom')).toBeInTheDocument();
  });

  test('applies className to the text fallback', () => {
    const { container } = render(<ExternalLink value="not-a-url" className="custom" />);
    expect(container.querySelector('span.custom')).toBeInTheDocument();
  });
});
