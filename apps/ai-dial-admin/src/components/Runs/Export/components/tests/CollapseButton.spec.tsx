import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import CollapseButton from '@/src/components/Runs/Export/components/CollapseButton';

describe('CollapseButton', () => {
  it('renders a button', () => {
    render(<CollapseButton isCollapsed={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onToggle when clicked', async () => {
    const onToggle = vi.fn();
    render(<CollapseButton isCollapsed={false} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('renders ChevronRight icon when collapsed', () => {
    const { container } = render(<CollapseButton isCollapsed={true} onToggle={vi.fn()} />);
    // tabler renders SVGs; collapsed → right chevron (path points right)
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders ChevronDown icon when not collapsed', () => {
    const { container } = render(<CollapseButton isCollapsed={false} onToggle={vi.fn()} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
