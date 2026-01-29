import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeAll, afterAll } from 'vitest';
import userEvent from '@testing-library/user-event';

import ItemsList from '@/src/components/Deployments/Common/ItemsList/ItemsList';
import { DeploymentsI18nKey } from '@/src/constants/i18n';

describe('Common ItemsList component', () => {
  const user = userEvent.setup();
  const scrollSpy = vi.spyOn(HTMLLIElement.prototype, 'scrollIntoView').mockImplementation(vi.fn());

  test('component rendered correctly', () => {
    const setItems = vi.fn();
    render(<ItemsList items={['item', 'item-2']} setItems={setItems} />);

    expect(screen.queryAllByRole('listitem').length).toBe(2);
  });

  test('delete correctly', async () => {
    const setItems = vi.fn();
    render(<ItemsList items={['item', 'item-2']} setItems={setItems} />);

    const button = screen.queryAllByRole('button')[0];

    expect(button).toBeInTheDocument();

    await user.click(button);

    await waitFor(() => {
      expect(setItems).toHaveBeenCalledWith(['item-2']);
    });
  });
  test('add correctly', async () => {
    const setItems = vi.fn();
    render(<ItemsList items={['item', 'item-2']} setItems={setItems} addItemLabel={'ADD'} />);

    const button = screen.getByRole('button', { name: 'ADD' });

    expect(button).toBeInTheDocument();

    await user.click(button);

    await waitFor(() => {
      expect(setItems).toHaveBeenCalledWith(['item', 'item-2', '']);
      expect(scrollSpy).toHaveBeenCalled();
    });
  });
});
