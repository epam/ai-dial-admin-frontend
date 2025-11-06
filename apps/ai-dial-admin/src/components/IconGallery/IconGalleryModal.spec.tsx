import { ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import IconGalleryModal from './IconGalleryModal';

describe('IconGalleryModal', () => {
  test('renders when open and calls onClose on cancel', () => {
    const onClose = vi.fn();
    render(<IconGalleryModal isModalOpen={true} selectedValue="icon1" onClose={onClose} onChange={vi.fn()} />);
    expect(screen.getByText(EntityFieldsI18nKey.iconUrl)).toBeInTheDocument();
    fireEvent.click(screen.getByText(ButtonsI18nKey.Cancel));
    expect(onClose).toHaveBeenCalled();
  });

  test('calls onChange and onClose on submit', () => {
    const onClose = vi.fn();
    const onChange = vi.fn();
    render(<IconGalleryModal isModalOpen={true} selectedValue="icon1" onClose={onClose} onChange={onChange} />);
    // Simulate selecting a new icon
    fireEvent.click(screen.getByText(ButtonsI18nKey.Apply));
    expect(onClose).toHaveBeenCalled();
  });

  test('does not render when not open', () => {
    render(<IconGalleryModal isModalOpen={false} selectedValue="icon1" onClose={vi.fn()} onChange={vi.fn()} />);
    expect(screen.queryByText(EntityFieldsI18nKey.iconUrl)).toBeNull();
  });
});
