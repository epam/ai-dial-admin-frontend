import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import CreateAdapter from '../CreateAdapter';

describe('CreateAdapter', () => {
  test('renders popup and adapter properties', () => {
    render(<CreateAdapter isModalOpen={true} onClose={vi.fn()} names={['adapter1']} />);

    expect(screen.getByText(ButtonsI18nKey.Cancel)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Create)).toBeInTheDocument();
  });

  test('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<CreateAdapter isModalOpen={true} onClose={onClose} names={[]} />);
    fireEvent.click(screen.getByText(ButtonsI18nKey.Cancel));
    expect(onClose).toHaveBeenCalled();
  });
});
