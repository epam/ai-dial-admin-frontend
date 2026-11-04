import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import ListEntities from '../List';

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: () => null,
}));

describe('ListEntities', () => {
  const renderList = () =>
    render(<ListEntities listLabel="Models" isEnableColumnPanel rowData={[{ id: 'model-1' }]} columnDefs={[]} />);

  test('names the Columns button by its label so it stays announced when the label is hidden on mobile', () => {
    renderList();

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Columns })).toHaveAttribute('aria-pressed', 'false');
  });

  test('toggles the pressed state of the Columns button on click', async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Columns }));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Columns })).toHaveAttribute('aria-pressed', 'true');
  });

  test('renders the list without a card surface of its own', () => {
    renderList();

    const root = screen.getByRole('heading', { level: 1, name: 'Models' }).closest('.size-full');
    expect(root).not.toHaveClass('bg-layer-2');
    expect(root).not.toHaveClass('rounded');
  });
});
