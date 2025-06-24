import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ContextMenu from './ContextMenu';

describe('Common components :: ContextMenu', () => {
  const contextMenuItems = [
    { title: 'Item 1', onClick: vi.fn(), icon: <span>Icon1</span> },
    { title: 'Item 2', onClick: vi.fn(), icon: <span>Icon2</span> },
  ];

  test('Should render children and open menu on click', () => {
    render(
      <ContextMenu contextMenuItems={contextMenuItems}>
        <span>OpenMenu</span>
      </ContextMenu>,
    );
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('context-menu'));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Icon1')).toBeInTheDocument();
    expect(screen.getByText('Icon2')).toBeInTheDocument();
  });

  test('Should call onClick and close menu when item is clicked', () => {
    const onClick1 = vi.fn();
    const items = [{ title: 'Item 1', onClick: onClick1, icon: <span>Icon1</span> }];
    render(
      <ContextMenu contextMenuItems={items}>
        <span>OpenMenu</span>
      </ContextMenu>,
    );
    fireEvent.click(screen.getByLabelText('context-menu'));
    const itemButton = screen.getByRole('menu').querySelector('button');
    expect(itemButton).toBeInTheDocument();
    if (itemButton) {
      fireEvent.click(itemButton);
    }
    expect(onClick1).toHaveBeenCalled();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
