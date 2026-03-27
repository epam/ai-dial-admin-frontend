import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import TabSelector, { TabOption } from '../TabSelector';

const tabs: TabOption[] = [
  { id: 'tab-a', label: 'Tab A' },
  { id: 'tab-b', label: 'Tab B' },
  { id: 'tab-c', label: 'Tab C' },
];

describe('TabSelector', () => {
  test('renders all tab labels', () => {
    render(<TabSelector tabs={tabs} activeTab="tab-a" onChange={vi.fn()} />);

    expect(screen.getByText('Tab A')).toBeInTheDocument();
    expect(screen.getByText('Tab B')).toBeInTheDocument();
    expect(screen.getByText('Tab C')).toBeInTheDocument();
  });

  test('shows check icon only for the active tab', () => {
    render(<TabSelector tabs={tabs} activeTab="tab-b" onChange={vi.fn()} />);

    const activeContainer = screen.getByText('Tab B').parentElement;
    const inactiveContainer = screen.getByText('Tab A').parentElement;

    expect(activeContainer?.querySelector('svg')).not.toBeNull();
    expect(inactiveContainer?.querySelector('svg')).toBeNull();
  });

  test('does not show any check icon when activeTab matches nothing', () => {
    render(<TabSelector tabs={tabs} activeTab="non-existent" onChange={vi.fn()} />);

    expect(document.querySelectorAll('svg')).toHaveLength(0);
  });

  test('calls onChange with the clicked tab id', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TabSelector tabs={tabs} activeTab="tab-a" onChange={onChange} />);

    await user.click(screen.getByText('Tab B'));

    expect(onChange).toHaveBeenCalledWith('tab-b');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test('calls onChange when active tab is clicked again', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<TabSelector tabs={tabs} activeTab="tab-a" onChange={onChange} />);

    await user.click(screen.getByText('Tab A'));

    expect(onChange).toHaveBeenCalledWith('tab-a');
  });
});
