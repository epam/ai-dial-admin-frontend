import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { TabsI18nKey } from '@/src/constants/i18n';
import TryOutEventsSection from '../components/TryOutEventsSection';

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: ({ entity, text }: { entity: unknown; text?: string }) => (
    <div>JsonEditor:{text ?? JSON.stringify(entity)}</div>
  ),
}));

vi.mock('@/src/components/Common/CopyButton/CopyButton', () => ({
  default: () => <button type="button">Copy</button>,
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    Spinner: () => <div>Loading...</div>,
    ElementSize: { Small: 'small' },
    GhostIconButton: ({ onClick }: { onClick: () => void }) => (
      <button type="button" onClick={onClick}>
        Maximize
      </button>
    ),
  };
});

describe('TryOutEventsSection', () => {
  test('renders nothing when streaming is omitted', () => {
    const { container } = render(<TryOutEventsSection events={[{ event: 'x', data: {} }]} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(TabsI18nKey.Events)).not.toBeInTheDocument();
  });

  test('renders nothing when streaming is false', () => {
    const { container } = render(<TryOutEventsSection streaming={false} events={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  test('shows a collapsed Events section when streaming is true with empty events', async () => {
    render(<TryOutEventsSection streaming events={[]} />);

    const toggle = screen.getByRole('button', { name: TabsI18nKey.Events });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('JsonEditor:[]')).not.toBeInTheDocument();

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('JsonEditor:[]')).toBeInTheDocument();
  });

  test('renders events JSON after expanding the section', async () => {
    const events = [{ event: 'response.created', data: { id: '1' } }];
    render(<TryOutEventsSection streaming events={events} />);

    await userEvent.click(screen.getByRole('button', { name: TabsI18nKey.Events }));

    expect(screen.getByText(`JsonEditor:${JSON.stringify(events)}`)).toBeInTheDocument();
  });
});
