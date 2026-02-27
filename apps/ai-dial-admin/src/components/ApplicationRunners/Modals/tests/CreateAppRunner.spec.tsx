import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import CreateAppRunner from '../CreateAppRunner';
import { ButtonsI18nKey, CreateI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';

describe('CreateAppRunner', () => {
  const baseProps = {
    isModalOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders popup and fields', () => {
    render(<CreateAppRunner {...baseProps} />);
    expect(screen.getByText(ButtonsI18nKey.Cancel)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Create)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Id)).toBeInTheDocument();
  });

  test('calls onClose when Cancel is clicked', () => {
    render(<CreateAppRunner {...baseProps} />);
    fireEvent.click(screen.getByText(ButtonsI18nKey.Cancel));
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  test('Create button is enabled when all fields are valid', () => {
    render(<CreateAppRunner {...baseProps} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName), {
      target: { value: 'Runner' },
    });
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Id), { target: { value: 'runner-1' } });
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Description), { target: { value: 'desc' } });
    const createBtn = screen.getByText(ButtonsI18nKey.Create);
    expect(createBtn).not.toBeDisabled();
  });
});
