import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import HorizontalCollapseBar from './HorizontalCollapseBar';

vi.mock('@tabler/icons-react', () => ({
  IconChevronsLeft: () => <span>LeftIcon</span>,
  IconChevronsRight: () => <span>RightIcon</span>,
}));

describe('Common components :: HorizontalCollapseBar', () => {
  test('Should render with children and title', () => {
    render(
      <HorizontalCollapseBar width="200" title="My Title">
        <div>ChildContent</div>
      </HorizontalCollapseBar>,
    );
    expect(screen.getByText('ChildContent')).toBeInTheDocument();
  });

  test('Should collapse and show title when button is clicked', () => {
    render(
      <HorizontalCollapseBar width="200" title="My Title">
        <div>ChildContent</div>
      </HorizontalCollapseBar>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('RightIcon')).toBeInTheDocument();
  });

  test('Should expand again when button is clicked twice', () => {
    render(
      <HorizontalCollapseBar width="200" title="My Title">
        <div>ChildContent</div>
      </HorizontalCollapseBar>,
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('ChildContent')).toBeVisible();
    expect(screen.getByText('LeftIcon')).toBeInTheDocument();
  });
});
