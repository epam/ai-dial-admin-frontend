import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ActionMenuOperationI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import CellContextMenu, { ContextMenuPosition } from '../CellContextMenu';

const basePosition: ContextMenuPosition = {
  x: 100,
  y: 200,
  value: 'some-value',
};

describe('CellContextMenu', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
    vi.stubGlobal('open', vi.fn());
  });

  test('renders Copy button', () => {
    render(<CellContextMenu position={basePosition} onClose={onClose} />);
    expect(screen.getByText(ButtonsI18nKey.Copy)).toBeInTheDocument();
  });

  test('does NOT render Open in new tab when href is absent', () => {
    render(<CellContextMenu position={basePosition} onClose={onClose} />);
    expect(screen.queryByText(ActionMenuOperationI18nKey.Open_in_new_tab)).not.toBeInTheDocument();
  });

  test('renders Open in new tab button when href is provided', () => {
    render(<CellContextMenu position={{ ...basePosition, href: '/adapters/my-adapter' }} onClose={onClose} />);
    expect(screen.getByText(ActionMenuOperationI18nKey.Open_in_new_tab)).toBeInTheDocument();
  });

  test('clicking Open in new tab calls window.open and onClose', () => {
    const href = '/adapters/my-adapter';
    render(<CellContextMenu position={{ ...basePosition, href }} onClose={onClose} />);

    fireEvent.click(screen.getByText(ActionMenuOperationI18nKey.Open_in_new_tab));

    expect(window.open).toHaveBeenCalledWith(href, '_blank');
    expect(onClose).toHaveBeenCalled();
  });

  test('renders nothing when position is null', () => {
    const { container } = render(<CellContextMenu position={null} onClose={onClose} />);
    expect(container).toBeEmptyDOMElement();
  });
});
