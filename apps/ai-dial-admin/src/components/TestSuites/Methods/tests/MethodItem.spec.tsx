import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import MethodItem from '../MethodItem';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialEllipsisTooltip: ({ text }: any) => <span>{text}</span>,
}));

const item = { method: 'GET', relativeUrlPattern: '/openai/v1/responses/[^/]+' };

describe('MethodItem', () => {
  test('renders a button carrying the method and the readable label', () => {
    render(
      <MethodItem
        index={1}
        item={item}
        isActive={false}
        onClick={vi.fn()}
        label="/openai/v1/responses/{response_id}"
      />,
    );

    expect(screen.getByRole('button', { name: 'GET /openai/v1/responses/{response_id}' })).toBeInTheDocument();
  });

  test('falls back to the URL pattern when no label is given', () => {
    render(<MethodItem index={1} item={item} isActive={false} onClick={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'GET /openai/v1/responses/[^/]+' })).toBeInTheDocument();
  });

  test('exposes the active state through aria-current', () => {
    render(<MethodItem index={1} item={item} isActive onClick={vi.fn()} label="/openai/v1/responses" />);

    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'true');
  });

  test('reports its index on click', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<MethodItem index={3} item={item} isActive={false} onClick={onClick} label="/openai/v1/responses" />);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledWith(3);
  });

  test('is reachable by keyboard and activates on Enter', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<MethodItem index={2} item={item} isActive={false} onClick={onClick} label="/openai/v1/responses" />);

    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledWith(2);
  });
});
