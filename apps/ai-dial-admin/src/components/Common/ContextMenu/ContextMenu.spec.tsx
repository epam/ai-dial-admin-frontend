import { fireEvent, getByText, render, within } from '@testing-library/react';
import ContextMenu from './ContextMenu';

const menuItemClickHandler = jest.fn();

const menuItems = [
  {
    title: 'Item 1',
    onClick: menuItemClickHandler,
    icon: <i></i>,
  },
];

describe('Common components - ContextMenu', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(
      <ContextMenu contextMenuItems={menuItems}>
        <div>children</div>
      </ContextMenu>,
    );

    const button = baseElement.getElementsByTagName('button')[0];

    expect(baseElement).toBeTruthy();
    expect(button).toBeTruthy();
    const children = button.getElementsByTagName('div')[0];
    expect(children).toBeTruthy();
    expect(getByText(children, 'children')).toBeTruthy();
  });

  it('Should render context menu on click', () => {
    const { baseElement } = render(
      <ContextMenu contextMenuItems={menuItems}>
        <div>children</div>
      </ContextMenu>,
    );

    const button = baseElement.getElementsByTagName('button')[0];

    fireEvent.click(button);
    const contextMenuButton = within(baseElement).getByText('Item 1');
    expect(contextMenuButton).toBeTruthy();
  });

  it('Should handle context menu item click', () => {
    const { baseElement } = render(
      <ContextMenu contextMenuItems={menuItems}>
        <div>children</div>
      </ContextMenu>,
    );

    const button = baseElement.getElementsByTagName('button')[0];

    fireEvent.click(button);
    const contextMenuButton = within(baseElement).getByText('Item 1');

    fireEvent.click(contextMenuButton);
    expect(menuItemClickHandler).toHaveBeenCalled();
  });
});
