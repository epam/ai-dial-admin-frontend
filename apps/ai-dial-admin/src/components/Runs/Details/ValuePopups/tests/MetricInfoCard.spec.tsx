import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import MetricInfoCard from '@/src/components/Runs/Details/ValuePopups/MetricInfoCard';

const info = { text: 'Because it overlaps', language: 'plaintext' };

const renderCard = (props: Partial<ComponentProps<typeof MetricInfoCard>> = {}) => {
  const onToggle = vi.fn();
  render(<MetricInfoCard title="reason" info={info} isOpen={false} onToggle={onToggle} {...props} />);
  return { onToggle };
};

describe('MetricInfoCard', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  test('Should render collapsed with its title and size', () => {
    renderCard();

    expect(screen.getByRole('button', { name: 'reason', expanded: false })).toBeInTheDocument();
    expect(screen.getByText('19 B')).toBeInTheDocument();
    expect(screen.queryByText('Because it overlaps')).not.toBeInTheDocument();
  });

  test('Should render the text when open', () => {
    renderCard({ isOpen: true });

    expect(screen.getByRole('button', { name: 'reason', expanded: true })).toBeInTheDocument();
    expect(screen.getByText('Because it overlaps')).toBeInTheDocument();
  });

  test('Should call onToggle when the title is clicked', async () => {
    const { onToggle } = renderCard();

    await user.click(screen.getByRole('button', { name: 'reason' }));

    expect(onToggle).toHaveBeenCalledOnce();
  });

  test('Should offer a copy button named after its title', () => {
    renderCard();

    expect(screen.getByRole('button', { name: 'copy reason' })).toBeInTheDocument();
  });

  test('Should have no fullscreen button', () => {
    renderCard({ isOpen: true });

    expect(screen.queryByRole('button', { name: 'Runs.OpenFullscreen' })).toBeNull();
  });
});
