import { AlertVariant } from '@epam/ai-dial-ui-kit';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import EntityBanner from '@/src/components/Deployments/Common/EntityBanner/EntityBanner';
import { ReactNode } from 'react';

vi.mock('@epam/ai-dial-ui-kit', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@epam/ai-dial-ui-kit');
  return {
    ...actual,
    DialAlert: ({
      variant,
      className,
      message,
      children,
    }: {
      variant: AlertVariant;
      className?: string;
      message: ReactNode;
      children?: ReactNode;
    }) => (
      <div data-variant={variant} className={className}>
        <div data-role="message">{message}</div>
        {children}
      </div>
    ),
  };
});

describe('EntityBanner', () => {
  test('defaults variant to Warning when none is provided', () => {
    render(<EntityBanner message="hello" />);
    expect(screen.getByText('hello').closest('[data-variant]')).toHaveAttribute('data-variant', AlertVariant.Warning);
  });

  test('forwards a custom variant to DialAlert', () => {
    render(<EntityBanner variant={AlertVariant.Error} message="boom" />);
    expect(screen.getByText('boom').closest('[data-variant]')).toHaveAttribute('data-variant', AlertVariant.Error);
  });

  test('renders the title as a semibold prefix when provided', () => {
    render(<EntityBanner title="Bold title" message="body text" />);
    const title = screen.getByText('Bold title');
    expect(title).toHaveClass('small-text-semi');
  });

  test('omits the semibold prefix when no title is provided', () => {
    const { container } = render(<EntityBanner message="just body" />);
    expect(container.querySelector('.small-text-semi')).toBeNull();
    expect(screen.getByText('just body')).toBeInTheDocument();
  });

  test('renders the message content', () => {
    render(<EntityBanner message="my message" />);
    expect(screen.getByText('my message')).toBeInTheDocument();
  });

  test('renders CTA children inside DialAlert', () => {
    render(
      <EntityBanner message="msg">
        <button>do thing</button>
      </EntityBanner>,
    );
    expect(screen.getByRole('button', { name: 'do thing' })).toBeInTheDocument();
  });

  test('forwards className to DialAlert', () => {
    const { container } = render(<EntityBanner className="mb-6" message="msg" />);
    expect(container.firstChild).toHaveClass('mb-6');
  });
});
