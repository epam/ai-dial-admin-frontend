import { fireEvent, render, screen } from '@testing-library/react';
import { describe, test, vi } from 'vitest';
import { ButtonsI18nKey } from '../../constants/i18n';
import ImportConfig from './ImportConfig';

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: vi.fn() }),
}));

vi.mock('@/src/app/[lang]/import-config/actions', () => ({
  importJsonConfigs: vi.fn(() => Promise.resolve({ success: true })),
  importZipConfig: vi.fn(() => Promise.resolve({ success: true })),
}));

describe('ImportConfig', () => {
  test('calls onNextStep from Files', () => {
    render(<ImportConfig />);
    fireEvent.click(screen.getByText(ButtonsI18nKey.Next));
  });
});
