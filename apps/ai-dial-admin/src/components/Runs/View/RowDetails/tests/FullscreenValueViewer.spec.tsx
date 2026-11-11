import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
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

  test('shows text that only looks like JSON as it is', () => {
    renderViewer({ value: '[not json' });

    expect(screen.getByText('[not json')).toBeTruthy();
  });

  test('shows escaped newlines in a plain string without reformatting them', () => {
    renderViewer({ value: 'first\\n\\nsecond' });

    expect(screen.getByText('first\\n\\nsecond')).toBeTruthy();
  });

  test('shows the value in the monospace code style and keeps its line breaks', () => {
    renderViewer({ value: 'line one\nline two' });

    const body = screen.getByText(/line one/);
    expect(body).toHaveClass('dial-code-text', 'whitespace-pre-wrap');
  });

  test('offers a close control that closes the viewer', async () => {
    const onClose = vi.fn();
    renderViewer({ onClose });

    await userEvent.setup().click(screen.getByRole('button', { name: /close/i }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  test('copies the value as shown, from a labeled Copy button', async () => {
    renderViewer({ fieldLabel: 'requestBody', value: '{"a":1}' });

    await userEvent.setup().click(screen.getByRole('button', { name: ButtonsI18nKey.Copy }));

    expect(await navigator.clipboard.readText()).toBe('{\n  "a": 1\n}');
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
