import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';

import AdaptiveHeaderActions from '@/src/components/EntityHeaderControls/AdaptiveHeaderActions/AdaptiveHeaderActions';
import { ButtonsI18nKey } from '@/src/constants/i18n';

const dropdownItemsSpy = vi.fn();

vi.mock('@epam/ai-dial-ui-kit', async () => {
  const actual = await vi.importActual<typeof import('@epam/ai-dial-ui-kit')>('@epam/ai-dial-ui-kit');
  return {
    ...actual,
    DialDropdown: ({ items, children }: { items: unknown[]; children: React.ReactNode }) => {
      dropdownItemsSpy(items);
      return <div data-testid="overflow-dropdown">{children}</div>;
    },
    DialIconButton: ({ 'aria-label': ariaLabel, icon }: { 'aria-label'?: string; icon: React.ReactNode }) => (
      <button type="button" aria-label={ariaLabel}>
        {icon}
      </button>
    ),
  };
});

const renderActions = (onExport = vi.fn()) =>
  render(
    <AdaptiveHeaderActions
      actions={{
        trailing: [
          {
            id: 'export',
            label: 'Export',
            icon: <span>export-icon</span>,
            onClick: onExport,
          },
        ],
      }}
      deleteAction={{
        id: 'delete',
        label: ButtonsI18nKey.Delete,
        icon: <span>delete-icon</span>,
        onClick: vi.fn(),
        appearance: 'danger',
      }}
    />,
  );

const stubResizeObserver = (available: number, needed: number) => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      private callback: ResizeObserverCallback;
      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
      }
      observe(target: Element) {
        Object.defineProperty(target, 'clientWidth', { configurable: true, value: available });
        const measure = target.querySelector('[aria-hidden="true"]') as HTMLElement | null;
        if (measure) {
          Object.defineProperty(measure, 'scrollWidth', { configurable: true, value: needed });
        }
        this.callback([], this as unknown as ResizeObserver);
      }
      disconnect() {}
      unobserve() {}
    },
  );
};

describe('AdaptiveHeaderActions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    dropdownItemsSpy.mockClear();
  });

  test('collapses to overflow menu when actions do not fit', () => {
    stubResizeObserver(200, 500);

    renderActions();

    expect(screen.getByRole('button', { name: ButtonsI18nKey.ShowMore })).toBeInTheDocument();
    expect(dropdownItemsSpy).toHaveBeenCalled();
    const items = dropdownItemsSpy.mock.calls.at(-1)?.[0] as { key: string }[];
    expect(items.map((item) => item.key)).toEqual(['export', 'delete']);
  });

  test('renders expanded action buttons when there is enough space', async () => {
    stubResizeObserver(800, 300);
    const user = userEvent.setup();
    const onExport = vi.fn();

    renderActions(onExport);

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.ShowMore })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Export' }));
    expect(onExport).toHaveBeenCalled();
  });
});
