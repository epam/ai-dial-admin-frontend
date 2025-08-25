import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HeaderWithHintButton from '@/src/components/Grid/HeaderComponents/HeaderWithHintButton';

describe('HeaderWithHintButton', () => {
  test('should render HeaderWithHintButton component', async () => {
    const user = userEvent.setup();
    const mockSort = vi.fn();
    const mockProgressSort = vi.fn();
    const mockHandler = vi.fn();
    const mockColumn = { getSort: mockSort, addEventListener: mockHandler, removeEventListener: mockHandler } as any;

    render(
      <HeaderWithHintButton
        hintText={'text'}
        hintTitle={'title'}
        displayName={'column name'}
        column={mockColumn}
        progressSort={mockProgressSort}
      />,
    );

    expect(screen.getByText('column name')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();

    await user.click(screen.getByText('column name'));

    expect(mockSort).toHaveBeenCalled();
  });
});
