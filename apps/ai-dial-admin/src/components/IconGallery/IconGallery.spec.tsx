import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import IconGallery from './IconGallery';

describe('IconGallery', () => {
  test('renders None icon and all icons', () => {
    const setSelectedIcon = vi.fn();
    render(<IconGallery selectedIcon={null} setSelectedIcon={setSelectedIcon} />);
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  test('calls setSelectedIcon when None icon is clicked', () => {
    const setSelectedIcon = vi.fn();
    render(<IconGallery selectedIcon={null} setSelectedIcon={setSelectedIcon} />);
    fireEvent.click(screen.getByText('None'));
    expect(setSelectedIcon).toHaveBeenCalledWith('');
  });
});
