import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import DuplicatePopup from './DuplicatePopup';
import { ApplicationRoute } from '@/src/types/routes';
import { ButtonsI18nKey, EntityPlaceholdersI18nKey } from '../../constants/i18n';

describe('DuplicatePopup', () => {
  const baseEntity = { name: 'oldName', displayName: 'oldDisplay', displayVersion: '1.0' };
  const baseProps = {
    view: 'Simple',
    modalState: 'Opened',
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

  test('updates displayName and version on change', () => {
    const onDuplicate = vi.fn();
    render(<DuplicatePopup {...baseProps} view={ApplicationRoute.Models} onDuplicate={onDuplicate} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Id), { target: { value: 'modelName' } });
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName), {
      target: { value: 'display' },
    });
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Version), { target: { value: '2.0' } });
    fireEvent.click(screen.getByText(ButtonsI18nKey.Duplicate));
    expect(onDuplicate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'modelName',
        displayName: 'display',
        displayVersion: '2.0',
      }),
    );
  });
});
