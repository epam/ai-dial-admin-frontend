import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import FullscreenValueViewer from '@/src/components/Runs/View/RowDetails/FullscreenValueViewer';

describe('FullscreenValueViewer', () => {
  const renderViewer = (props?: Partial<Parameters<typeof FullscreenValueViewer>[0]>) =>
    render(<FullscreenValueViewer isOpen fieldLabel="Request" value="plain value" onClose={vi.fn()} {...props} />);

  test('shows the value under the field label', () => {
    renderViewer();

    expect(screen.getByRole('dialog', { name: 'Request' })).toBeTruthy();
    expect(screen.getByText('plain value')).toBeTruthy();
  });

  test('pretty-prints a JSON value', () => {
    renderViewer({ value: '{"a":1}' });

    expect(screen.getByText(/"a": 1/)).toBeTruthy();
  });

  test('renders nothing while closed', () => {
    renderViewer({ isOpen: false });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('keeps a fixed height at desktop widths instead of the kit md:h-auto', () => {
    renderViewer();

    const dialog = screen.getByRole('dialog', { name: 'Request' });

    expect(dialog.classList.contains('md:h-[80vh]')).toBe(true);
    expect(dialog.classList.contains('md:h-auto')).toBe(false);
  });
});
