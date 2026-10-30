import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import KpiDeltaBadge from '@/src/components/TestSuites/Trends/Kpi/KpiDeltaBadge';

let scrollWidth = 0;
let clientWidth = 0;
let latestObserver: CapturingResizeObserver | undefined;

class CapturingResizeObserver implements ResizeObserver {
  constructor(private callback: ResizeObserverCallback) {
    latestObserver = this;
  }

  observe(_target: Element, _options?: ResizeObserverOptions): void {}

  unobserve(_target: Element): void {}

  disconnect(): void {}

  takeRecords(): ResizeObserverEntry[] {
    return [];
  }

  trigger(): void {
    this.callback([], this);
  }
}

vi.mock('@epam/ai-dial-ui-kit', () => ({
  Tooltip: ({
    children,
    tooltip,
    hideTooltip,
  }: {
    children: React.ReactNode;
    tooltip?: React.ReactNode;
    hideTooltip?: boolean;
  }) => (
    <div>
      {!hideTooltip && <span role="tooltip">{tooltip}</span>}
      {children}
    </div>
  ),
  Badge: ({ label, textClassName }: { label: string; textClassName?: string }) => (
    <span className={textClassName}>{label}</span>
  ),
  BadgeVariant: { Filled: 'filled' },
  BadgeColor: { Green: 'green', Red: 'red' },
}));

describe('KpiDeltaBadge', () => {
  beforeEach(() => {
    scrollWidth = 300;
    clientWidth = 300;
    latestObserver = undefined;

    vi.stubGlobal('ResizeObserver', CapturingResizeObserver);
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('truncate') ? scrollWidth : 0;
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('truncate') ? clientWidth : 0;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test('hides the tooltip when the badge text fits and shows it when resizing causes overflow', async () => {
    render(<KpiDeltaBadge label="+1.0%" higherIsBetter />);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    clientWidth = 200;
    act(() => latestObserver?.trigger());

    await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument());
  });

  test('shows the tooltip when the badge text is clipped', async () => {
    scrollWidth = 301;

    render(<KpiDeltaBadge label="+1.0%" higherIsBetter />);

    await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument());
  });
});
