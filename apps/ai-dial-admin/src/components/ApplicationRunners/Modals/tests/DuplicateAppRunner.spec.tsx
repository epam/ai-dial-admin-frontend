import { ButtonsI18nKey } from '@/src/constants/i18n';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DuplicateScheme from '../DuplicateAppRunner';

const baseEntity = {
  $id: 'app-1',
  'dial:applicationTypeDisplayName': 'AppName',
};

describe('DuplicateScheme', () => {
  it('renders and calls onDuplicate on submit', () => {
    const onDuplicate = vi.fn();
    const onClose = vi.fn();
    render(
      <DuplicateScheme isModalOpen={true} onDuplicate={onDuplicate} onClose={onClose} entity={baseEntity as any} />,
    );
    fireEvent.change(screen.getAllByRole('textbox')[0], { target: { value: 'new-id' } });
    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: 'New Name' } });
    fireEvent.click(screen.getByText(ButtonsI18nKey.Duplicate));
    expect(onDuplicate).toHaveBeenCalledWith({ $id: 'new-id', 'dial:applicationTypeDisplayName': 'New Name' });
  });

  it('calls onClose on cancel', () => {
    const onDuplicate = vi.fn();
    const onClose = vi.fn();
    render(
      <DuplicateScheme isModalOpen={true} onDuplicate={onDuplicate} onClose={onClose} entity={baseEntity as any} />,
    );
    fireEvent.click(screen.getByText(ButtonsI18nKey.Cancel));
    expect(onClose).toHaveBeenCalled();
  });
});
