import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HeaderWithHintButton from '@/src/components/Grid/HeaderComponents/HeaderWithHintButton';

describe('HeaderWithHintButton', () => {
  test('should render HeaderWithHintButton component', async () => {
    const user = userEvent.setup();

    render(<HeaderWithHintButton hintText="text" hintTitle="title" displayName="column name" />);

    expect(screen.getByText('column name')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
