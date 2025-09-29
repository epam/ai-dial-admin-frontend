import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import VersionControl from '../Version';
import userEvent from '@testing-library/user-event';

describe('EntityVersion', () => {
  const user = userEvent.setup();
  const onChange = vi.fn();

  test('should render version control correctly', async () => {
    render(<VersionControl version={'version'} onChange={onChange} />);

    const input = screen.getByDisplayValue('version');
    expect(input).toBeInTheDocument();

    await user.type(input, 'new');

    expect(onChange).toHaveBeenCalled();
  });
});
