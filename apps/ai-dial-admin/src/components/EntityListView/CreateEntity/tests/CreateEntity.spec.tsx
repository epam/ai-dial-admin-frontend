import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import CreateEntity from '../CreateEntity';
import { ApplicationRoute } from '@/src/types/routes';

describe('CreateEntity', () => {
  test('renders popup and adapter properties', () => {
    render(<CreateEntity route={ApplicationRoute.Models} isModalOpen={true} onClose={vi.fn()} names={['model1']} />);
    expect(screen.getByText(CreateI18nKey.Title)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Cancel)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Create)).toBeInTheDocument();
  });

  test('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<CreateEntity route={ApplicationRoute.Models} isModalOpen={true} onClose={onClose} names={[]} />);
    fireEvent.click(screen.getByText(ButtonsI18nKey.Cancel));
    expect(onClose).toHaveBeenCalled();
  });
});
