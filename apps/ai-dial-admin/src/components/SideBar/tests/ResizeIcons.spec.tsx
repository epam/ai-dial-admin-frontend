import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { LeftSideBarResizeIcon, RightSideBarResizeIcon } from '../ResizeIcons';

vi.mock('@tabler/icons-react', () => ({
  IconChevronLeft: (props: object) => <span {...props}>LeftIcon</span>,
  IconChevronRight: (props: object) => <span {...props}>RightIcon</span>,
}));

describe('ResizeIcons', () => {
  test('renders LeftSideBarResizeIcon with given className', () => {
    render(<LeftSideBarResizeIcon className="left-class" />);
    const wrapper = screen.getByText('LeftIcon').parentElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.className).toBe('left-class');
    expect(screen.getByText('LeftIcon').className).toContain('-ml-6');
    expect(screen.getByText('LeftIcon').className).toContain('h-full');
  });

  test('renders RightSideBarResizeIcon with given className', () => {
    render(<RightSideBarResizeIcon className="right-class" />);
    const wrapper = screen.getByText('RightIcon').parentElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.className).toBe('right-class');
    expect(screen.getByText('RightIcon').className).toContain('h-full');
  });
});
