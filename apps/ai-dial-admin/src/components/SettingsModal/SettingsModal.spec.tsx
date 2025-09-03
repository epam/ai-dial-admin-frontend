import { SettingsModalI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { PopUpState } from '@/src/types/pop-up';
import { fireEvent, render, screen } from '@testing-library/react';
import SettingsModal from './SettingsModal';
import { describe, expect, test, vi } from 'vitest';
const mockOnClose = vi.fn();
const mockOnConfirm = vi.fn();

vi.mock('@/src/context/ThemeContext', () => ({
  useTheme: () => ({
    themes: [
      { id: 'light', displayName: 'Light' },
      { id: 'dark', displayName: 'Dark' },
    ],
    currentTheme: 'light',
  }),
}));

describe('SettingsModal', () => {
  test('renders and allows theme selection and confirm', () => {
    render(<SettingsModal modalState={PopUpState.Opened} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    expect(screen.getByText(SettingsModalI18nKey.Settings)).toBeInTheDocument();

    expect(screen.getByText(SettingsModalI18nKey.Theme)).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: ButtonsI18nKey.Save });

    fireEvent.click(saveBtn);

    expect(mockOnConfirm).toHaveBeenCalledWith({ theme: 'light' });
  });
});
