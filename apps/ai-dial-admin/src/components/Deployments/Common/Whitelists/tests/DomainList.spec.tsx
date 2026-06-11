import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

import DomainList from '../DomainList';

// Render DialTooltip content inline so the tooltip message is queryable (the real
// component only mounts its content on hover, via a portal).
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialTooltip: ({ children, tooltip }: { children: ReactNode; tooltip?: ReactNode }) => (
      <>
        {children}
        {tooltip}
      </>
    ),
  };
});

describe('DomainList', () => {
  test('decorates an invalid domain with error text, info icon, and tooltip message', () => {
    const errors = { 'bad!': ["domain 'bad!' is not a valid domain name"] };
    render(<DomainList domains={['good.com', 'bad!']} errors={errors} />);

    expect(screen.getByText('bad!')).toHaveClass('text-error');
    expect(screen.getByLabelText('bad!')).toBeInTheDocument();
    expect(screen.getByText("domain 'bad!' is not a valid domain name")).toBeInTheDocument();
  });

  test('does not decorate a valid sibling domain', () => {
    const errors = { 'bad!': ["domain 'bad!' is not a valid domain name"] };
    render(<DomainList domains={['good.com', 'bad!']} errors={errors} />);

    expect(screen.getByText('good.com')).not.toHaveClass('text-error');
    expect(screen.queryByLabelText('good.com')).not.toBeInTheDocument();
  });

  test('renders rows unchanged when no error map is provided', () => {
    render(<DomainList domains={['good.com', 'a.com']} />);

    expect(screen.getByText('good.com')).not.toHaveClass('text-error');
    expect(screen.getByText('a.com')).not.toHaveClass('text-error');
    expect(screen.queryByLabelText('good.com')).not.toBeInTheDocument();
  });
});
