import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import DeleteFolder from '../Modals/DeleteFolder';
import { ButtonsI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { PopUpState } from '@/src/types/pop-up';

describe('DeleteFolder', () => {
  const baseProps = {
    isModalOpen: true,
    onClose: vi.fn(),
    onApply: vi.fn(),
  };
  test('renders DeleteFolder', () => {
    render(<DeleteFolder {...baseProps} />);
    expect(screen.getByText(FoldersI18nKey.DeleteFolder)).toBeInTheDocument();
  });

  test('calls onClose when Cancel is clicked', () => {
    render(<DeleteFolder {...baseProps} />);
    fireEvent.click(screen.getByText(ButtonsI18nKey.Cancel));
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  test('calls onApply when Delete is clicked', () => {
    const onApply = vi.fn();
    render(<DeleteFolder {...baseProps} onApply={onApply} />);
    fireEvent.click(screen.getByText(ButtonsI18nKey.Delete));
    expect(onApply).toHaveBeenCalled();
  });
});
