import { render, screen } from '@testing-library/react';
import Sidebar from '../SideBar';
import { SideBarOrientation } from '@/src/types/side-bar';
import { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('re-resizable', () => ({
  Resizable: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe('Sidebar', () => {
  test('renders left sidebar with content when open', () => {
    render(<Sidebar isOpen={true} side={SideBarOrientation.Left} itemComponent={<span>Sidebar Content</span>} />);
    expect(screen.getByText('Sidebar Content')).toBeInTheDocument();
  });

  test('renders right sidebar with content when open', () => {
    render(<Sidebar isOpen={true} side={SideBarOrientation.Right} itemComponent={<span>Right Content</span>} />);
    expect(screen.getByText('Right Content')).toBeInTheDocument();
  });
});
