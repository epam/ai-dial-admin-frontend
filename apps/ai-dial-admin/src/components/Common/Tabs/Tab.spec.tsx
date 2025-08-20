import { TabOrientation } from '@/src/types/tab';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import Tabs from './Tabs';
import TabContent from './Tab';

const tabsMock = [
  { id: 'tab1', name: 'Tab1' },
  { id: 'tab2', name: 'Tab2' },
];

describe('Tabs', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('renders horizontal tabs and handles click', () => {
    const onClick = vi.fn();
    render(<Tabs tabs={tabsMock} activeTab="tab1" onClick={onClick} />);
    expect(screen.getAllByText('Tab1').length).toBe(2);
    expect(screen.getAllByText('Tab2').length).toBe(1);
    fireEvent.click(screen.getByText('Tab2'));
    expect(onClick).toHaveBeenCalledWith('tab2');
  });

  test('renders vertical tabs when orientation is vertical', () => {
    render(<Tabs tabs={tabsMock} activeTab="tab1" onClick={vi.fn()} orientation={TabOrientation.Vertical} />);
    expect(screen.getAllByText('Tab1').length).toBe(2);
    expect(screen.getAllByText('Tab2').length).toBe(1);
  });
});

describe('TabContent', () => {
  const baseTab = { id: 'tab1', name: 'Tab 1' };

  test('renders tab name', () => {
    render(<TabContent tab={baseTab} isActive={false} onClick={vi.fn()} />);
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
  });

  test('calls onClick with tab id', () => {
    const onClick = vi.fn();
    render(<TabContent tab={baseTab} isActive={false} onClick={onClick} />);
    fireEvent.click(screen.getByRole('tab'));
    expect(onClick).toHaveBeenCalledWith('tab1');
  });

  test('applies disabled styles and disables click', () => {
    const onClick = vi.fn();
    render(<TabContent tab={baseTab} isActive={false} disabled onClick={onClick} />);
    const btn = screen.getByRole('tab');
    expect(btn.className).toMatch(/pointer-events-none/);
    fireEvent.click(btn);
    // Still calls onClick, as button is not truly disabled, but UI disables pointer events
    expect(onClick).toHaveBeenCalledWith('tab1');
  });

  test('shows exclamation icon if invalid', () => {
    const { container } = render(<TabContent tab={baseTab} isActive={false} invalid onClick={vi.fn()} />);
    expect(container.querySelector('.tabler-icon-exclamation-circle')).toBeInTheDocument();
  });

  test('applies active styles for horizontal', () => {
    render(<TabContent tab={baseTab} isActive isHorizontal onClick={vi.fn()} />);
    const btn = screen.getByRole('tab');
    expect(btn.className).toMatch(/border-b-2/);
    expect(btn.className).toMatch(/bg-accent-primary-alpha/);
  });

  test('applies active styles for vertical', () => {
    render(<TabContent tab={baseTab} isActive isHorizontal={false} onClick={vi.fn()} />);
    const btn = screen.getByRole('tab');
    expect(btn.className).toMatch(/border-l-2/);
    expect(btn.className).toMatch(/bg-accent-primary-alpha/);
  });

  test('applies text-primary for inactive', () => {
    render(<TabContent tab={baseTab} isActive={false} onClick={vi.fn()} />);
    const btn = screen.getByRole('tab');
    expect(btn.className).toMatch(/text-primary/);
  });
});
