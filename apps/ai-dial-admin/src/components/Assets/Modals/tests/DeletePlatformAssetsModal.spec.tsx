import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import DeletePlatformAssetsModal from '../DeletePlatformAssetsModal';
import { getDeleteModalDescription, getDeleteModalTitle } from '../utils';

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData }: { rowData: { name: string }[] }) => (
    <ul aria-label="rows-to-delete">
      {rowData.map((row) => (
        <li key={row.name}>{row.name}</li>
      ))}
    </ul>
  ),
}));

const VIEW = ApplicationRoute.PlatformModels;
const t = (key: string) => key;
const ITEMS = [
  { name: 'gpt', path: 'platform/gpt' },
  { name: 'claude', path: 'platform/claude' },
] as never;

const renderModal = () => {
  const onRemove = vi.fn();
  const onClose = vi.fn();
  render(<DeletePlatformAssetsModal view={VIEW} isOpen itemsToDelete={ITEMS} onRemove={onRemove} onClose={onClose} />);

  return { onRemove, onClose };
};

describe('DeletePlatformAssetsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('titles and describes the delete for the selected platform rows', () => {
    renderModal();

    expect(screen.getByText(getDeleteModalTitle(VIEW, t as never, 2, false) as string)).toBeInTheDocument();
    expect(screen.getByText(getDeleteModalDescription(VIEW, t as never, 2, false) as string)).toBeInTheDocument();
  });

  test('lists only the selected rows, with no folder tree', () => {
    renderModal();

    expect(screen.getByRole('list', { name: 'rows-to-delete' })).toBeInTheDocument();
    expect(screen.getByText('gpt')).toBeInTheDocument();
    expect(screen.getByText('claude')).toBeInTheDocument();
    expect(screen.queryByRole('tree')).not.toBeInTheDocument();
  });

  test('confirms the delete', async () => {
    const { onRemove, onClose } = renderModal();

    await userEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Delete }));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  test('cancels without deleting', async () => {
    const { onRemove, onClose } = renderModal();

    await userEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

    expect(onClose).toHaveBeenCalled();
    expect(onRemove).not.toHaveBeenCalled();
  });
});
