import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import QueryHeader from '@/src/components/Analytics/QueryBuilder/Layout/QueryHeader';

describe('QueryHeader', () => {
  test('renders the title as the page heading', () => {
    render(<QueryHeader title="Daily usage" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Daily usage' })).toBeInTheDocument();
  });

  test('renders its children as the actions beside the title', () => {
    render(
      <QueryHeader title="Daily usage">
        <button type="button">Run</button>
        <button type="button">Save</button>
      </QueryHeader>,
    );

    expect(screen.getByRole('button', { name: 'Run' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  test('shows the description under the title', () => {
    render(<QueryHeader title="Daily usage" description="Requests per deployment per day" />);

    expect(screen.getByText('Requests per deployment per day')).toBeInTheDocument();
  });

  test.each([
    ['no description', undefined],
    ['an empty description', ''],
  ])('renders only the title for %s', (_case, description) => {
    const { container } = render(<QueryHeader title="Daily usage" description={description} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Daily usage' })).toBeInTheDocument();
    expect(container).toHaveTextContent(/^Daily usage$/);
  });
});
