import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import IconGallery from './IconGallery';

describe('IconGallery', () => {
  test('renders None icon and all icons', () => {
    const setSelectedIcon = vi.fn();
    render(<IconGallery selectedIcon={null} setSelectedIcon={setSelectedIcon} />);
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.getByText('Imagen')).toBeInTheDocument();
    expect(screen.getByText('Mind-Map')).toBeInTheDocument();
  });

  test('calls setSelectedIcon when None icon is clicked', () => {
    const setSelectedIcon = vi.fn();
    render(<IconGallery selectedIcon={null} setSelectedIcon={setSelectedIcon} />);
    fireEvent.click(screen.getByText('None'));
    expect(setSelectedIcon).toHaveBeenCalledWith('');
  });

  test('calls setSelectedIcon when a gallery icon is clicked', () => {
    const setSelectedIcon = vi.fn();
    render(<IconGallery selectedIcon={null} setSelectedIcon={setSelectedIcon} />);
    fireEvent.click(screen.getByText('Mind-Map').closest('button')!);
    expect(setSelectedIcon).toHaveBeenCalledWith('Mind-Map.svg');
    fireEvent.click(screen.getByText('Imagen').closest('button')!);
    expect(setSelectedIcon).toHaveBeenCalledWith('Imagen.svg');
  });
});
