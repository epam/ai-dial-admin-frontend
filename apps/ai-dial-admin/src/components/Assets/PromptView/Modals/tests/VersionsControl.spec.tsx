import { describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VersionsControl from '../VersionsControl';


describe('Common components - VersionsControl', () => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  test('renders component correctly', async () => {
    render(<VersionsControl version={'1.0.1'} versions={['1.0.0', '1.0.1']} setVersion={onChange} />);

    const item = screen.getByRole('menuitem', { name: `1.0.1` });

    expect(item).toBeInTheDocument();
    user.click(item);

    await waitFor(async () => {
      const secondItem = screen.getByRole('menuitem', { name: `1.0.0` });

      expect(secondItem).toBeInTheDocument();

      user.click(secondItem);

      await waitFor(async () => {
        expect(onChange).toHaveBeenCalled();
      });
    });
  });
});
