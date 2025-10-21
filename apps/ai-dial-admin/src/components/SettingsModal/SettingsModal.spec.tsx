import { ButtonsI18nKey, SettingsModalI18nKey } from '@/src/constants/i18n';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import SettingsModal from './SettingsModal';
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
    render(<SettingsModal isModalOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} />);

    expect(screen.getByText(SettingsModalI18nKey.Settings)).toBeInTheDocument();

    expect(screen.getByText(SettingsModalI18nKey.Theme)).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: ButtonsI18nKey.Save });

    fireEvent.click(saveBtn);

    expect(mockOnConfirm).toHaveBeenCalledWith({ theme: 'light' });
  });
});
