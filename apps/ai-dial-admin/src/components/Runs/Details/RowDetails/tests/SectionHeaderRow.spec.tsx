import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';
import { describe, expect, test, vi } from 'vitest';

import SectionHeaderRow from '@/src/components/Runs/Details/RowDetails/SectionHeaderRow';

describe('SectionHeaderRow', () => {
  const renderRow = (props?: Partial<ComponentProps<typeof SectionHeaderRow>>) =>
    render(<SectionHeaderRow label="Execution" isCollapsed={false} onToggle={vi.fn()} {...props} />);

  test('reports an expanded section through aria-expanded', () => {
    renderRow({ isCollapsed: false });

    expect(screen.getByRole('button', { name: 'Execution' })).toHaveAttribute('aria-expanded', 'true');
  });

  test('reports a collapsed section through aria-expanded', () => {
    renderRow({ isCollapsed: true });

    expect(screen.getByRole('button', { name: 'Execution' })).toHaveAttribute('aria-expanded', 'false');
  });

  test('calls onToggle when activated', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderRow({ onToggle });

    await user.click(screen.getByRole('button', { name: 'Execution' }));

    expect(onToggle).toHaveBeenCalledOnce();
  });

  test('lets a caller override the row height and label colour', () => {
    renderRow({ className: 'h-12', contentClassName: 'gap-2 text-primary' });

    const button = screen.getByRole('button', { name: 'Execution' });
    expect(button).toHaveClass('h-12');
    expect(screen.getByText('Execution')).toHaveClass('gap-2', 'text-primary');
    expect(screen.getByText('Execution')).not.toHaveClass('text-secondary');
  });

  test('keeps the Compare look when no overrides are given', () => {
    renderRow();

    expect(screen.getByRole('button', { name: 'Execution' })).toHaveClass('p-3', 'bg-layer-3');
    expect(screen.getByText('Execution')).toHaveClass('gap-1', 'text-secondary');
  });
});
