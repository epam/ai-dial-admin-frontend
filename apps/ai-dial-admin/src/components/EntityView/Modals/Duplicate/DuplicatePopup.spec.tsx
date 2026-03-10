import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';
import { ButtonsI18nKey, EntityPlaceholdersI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { checkIsUniqueDeploymentName } from '@/src/app/actions';

import DuplicatePopup from './Duplicate';

vi.mock('@/src/app/actions');

describe('DuplicatePopup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  test('clears duplicate ID validation message when entity ID value changed and enables Duplicate button', async () => {
    (checkIsUniqueDeploymentName as any).mockResolvedValue(false);

    render(<DuplicatePopup {...baseProps} view={ApplicationRoute.Models} />);

    const duplicateBtn = screen.getByRole('button', { name: ButtonsI18nKey.Duplicate });

    fireEvent.click(duplicateBtn);

    await waitFor(() => {
      expect(duplicateBtn).toBeDisabled();
      expect(screen.getByText(ErrorI18nKey.NameExists)).toBeInTheDocument();
    });

    const idInput = screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Id);

    fireEvent.change(idInput, { target: { value: 'NewId' } });

    await waitFor(() => {
      expect(duplicateBtn).not.toBeDisabled();
      expect(screen.queryByText(ErrorI18nKey.NameExists)).not.toBeInTheDocument();
    });
  });
});
