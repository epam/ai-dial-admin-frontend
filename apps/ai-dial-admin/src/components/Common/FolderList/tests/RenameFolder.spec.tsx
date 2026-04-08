import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import RenameFolder from '../Modals/RenameFolder';
import { ActionMenuOperationI18nKey, ButtonsI18nKey, FoldersI18nKey } from '@/src/constants/i18n';

describe('RenameFolder', () => {
  const baseProps = {
    currentPath: 'path',
    isModalOpen: true,
    onClose: vi.fn(),
    onApply: vi.fn(),
  };
  test('renders DeleteFolder', () => {
    render(<RenameFolder {...baseProps} />);
    expect(screen.getByText(ActionMenuOperationI18nKey.Rename)).toBeInTheDocument();
  });

  test('calls onClose when Cancel is clicked', () => {
    render(<RenameFolder {...baseProps} />);
    fireEvent.click(screen.getByText(ButtonsI18nKey.Cancel));
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  test('calls onApply when Apply is clicked', () => {
    const onApply = vi.fn();
    render(<RenameFolder {...baseProps} onApply={onApply} />);
    fireEvent.change(screen.getByPlaceholderText(FoldersI18nKey.FolderCreatePlaceholder), {
      target: { value: 'newName' },
    });

    fireEvent.click(screen.getByText(ButtonsI18nKey.Apply));
    expect(onApply).toHaveBeenCalled();
  });
});
