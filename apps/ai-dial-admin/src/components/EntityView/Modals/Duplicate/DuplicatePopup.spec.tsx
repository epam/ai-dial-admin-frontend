import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import DuplicatePopup from './Duplicate';
import { ApplicationRoute } from '@/src/types/routes';
import { ButtonsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';

describe('DuplicatePopup', () => {
  const baseEntity = { name: 'oldName', displayName: 'oldDisplay', displayVersion: '1.0' };
  const baseProps = {
    view: 'Simple',
    isModalOpen: true,
    names: ['existing'],
    entity: baseEntity,
    onClose: vi.fn(),
    onDuplicate: vi.fn(),
  };

  test('calls onClose when Cancel is clicked', () => {
    render(<DuplicatePopup {...baseProps} />);
    fireEvent.click(screen.getByText(ButtonsI18nKey.Cancel));
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  test('calls onDuplicate with cloned entity when Duplicate is clicked', () => {
    const onDuplicate = vi.fn();
    render(<DuplicatePopup {...baseProps} onDuplicate={onDuplicate} />);
    // Set name to make isValid true
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Id), { target: { value: 'newName' } });
    fireEvent.click(screen.getByText(ButtonsI18nKey.Duplicate));
    expect(onDuplicate).toHaveBeenCalledWith(expect.objectContaining({ name: 'newName' }));
  });
  test('renders displayName and version fields for model entity', () => {
    render(<DuplicatePopup {...baseProps} view={ApplicationRoute.Models} />);
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Version)).toBeInTheDocument();
  });
});
