import { render, screen } from '@testing-library/react';
import { ICellRendererParams } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';

import { DescriptionCellRenderer } from '@/src/components/Analytics/Tables/DescriptionCell';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { AnalyticsTableColumn } from '@/src/models/analytics/table';

const column = (description?: string): AnalyticsTableColumn => ({
  source_name: 'mood',
  name: 'mood',
  type: AnalyticsFieldType.String,
  description,
});

// jsdom reports every element as zero-height, so ExpandableText's overflow check needs the clamped box to
// look taller than its clamp for the control to appear at all.
const stubOverflow = (scrollHeight: number, clientHeight: number) => {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(scrollHeight);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(clientHeight);
};

const renderCell = (data?: AnalyticsTableColumn, api?: Partial<ICellRendererParams['api']>) =>
  render(<DescriptionCellRenderer {...({ data, api } as unknown as ICellRendererParams<AnalyticsTableColumn>)} />);

describe('Tables :: DescriptionCellRenderer', () => {
  test('offers Show more for a description longer than the clamp', () => {
    stubOverflow(200, 40);
    renderCell(column('A description long enough that the clamp cannot show all of it at once.'));

    expect(screen.getByText(ButtonsI18nKey.ShowMore)).toBeInTheDocument();
  });

  test('offers no control for a description that fits', () => {
    stubOverflow(40, 40);
    renderCell(column('Short.'));

    expect(screen.queryByText(ButtonsI18nKey.ShowMore)).toBeNull();
  });

  // The grid measures a row before the cell renders, so a cell that grows has to ask it to measure again
  // or the revealed text is clipped by a row that never grew. The shared ResizeObserver mock records the
  // observer rather than driving it, so the resize is delivered by hand.
  test('asks the grid to measure the row again when its height changes', () => {
    const resetRowHeights = vi.fn();
    const observers: { callback: ResizeObserverCallback }[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(public callback: ResizeObserverCallback) {
          observers.push(this);
        }
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      },
    );

    stubOverflow(200, 40);
    renderCell(column('A description long enough to need the control.'), { resetRowHeights });

    // ExpandableText observes its own content too, so every observer this render created is fired.
    observers.forEach((observer) => observer.callback([], {} as ResizeObserver));

    expect(resetRowHeights).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  test('renders nothing for a column carrying no description', () => {
    const { container } = renderCell(column());

    expect(container).toBeEmptyDOMElement();
  });
});
