import { AlertVariant } from '@epam/ai-dial-ui-kit';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import BlockedDomainBanner from '@/src/components/Deployments/Common/BlockedDomainBanner/BlockedDomainBanner';

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
      message: React.ReactNode;
      children?: React.ReactNode;
    }) => (
      <div data-variant={variant} className={className}>
        <div data-role="message">{message}</div>
        {children}
      </div>
    ),
    DialNeutralButton: ({ label, onClick }: { label: string; onClick: () => void }) => (
      <button onClick={onClick}>{label}</button>
    ),
  };
});

describe('BlockedDomainBanner', () => {
  test('renders the provided message', () => {
    render(
      <BlockedDomainBanner message="domain x.example.com was blocked" buttonLabel="Add" onAddToAllowed={vi.fn()} />,
    );
    expect(screen.getByText('domain x.example.com was blocked')).toBeInTheDocument();
  });

  test('renders the button with the provided label', () => {
    render(<BlockedDomainBanner message="msg" buttonLabel="Add to allowed domains" onAddToAllowed={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Add to allowed domains' })).toBeInTheDocument();
  });

  test('uses the Error alert variant', () => {
    render(<BlockedDomainBanner message="msg" buttonLabel="Add" onAddToAllowed={vi.fn()} />);
    expect(screen.getByText('msg').closest('[data-variant]')).toHaveAttribute('data-variant', AlertVariant.Error);
  });

  test('fires onAddToAllowed when the button is clicked', () => {
    const onAddToAllowed = vi.fn();
    render(<BlockedDomainBanner message="msg" buttonLabel="Add to allowed domains" onAddToAllowed={onAddToAllowed} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add to allowed domains' }));
    expect(onAddToAllowed).toHaveBeenCalledTimes(1);
  });
});
