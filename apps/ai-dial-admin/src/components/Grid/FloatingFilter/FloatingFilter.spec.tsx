import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import FloatingFilter from './FloatingFilter';
import { BasicI18nKey } from '@/src/constants/i18n';
import { FLOATING_FILTER_DEBOUNCE_MS } from '@/src/constants/ag-grid';

describe('FloatingFilter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders input and icon', () => {
    const props = {
      parentFilterInstance: vi.fn(),
      currentParentModel: () => ({ filter: 'abc' }),
    } as any;
    render(<FloatingFilter {...props} />);
    expect(screen.getByPlaceholderText(BasicI18nKey.Search)).toBeInTheDocument();
    expect(screen.getByDisplayValue('abc')).toBeInTheDocument();
  });

  test('calls parentFilterInstance only after the user stops typing', () => {
    const onFloatingFilterChanged = vi.fn();
    const parentFilterInstance = (cb: any) => cb({ onFloatingFilterChanged });
    const props = {
      parentFilterInstance,
      currentParentModel: () => ({ filter: '' }),
    } as any;
    render(<FloatingFilter {...props} />);
    const input = screen.getByPlaceholderText(BasicI18nKey.Search);

    fireEvent.change(input, { target: { value: 't' } });
    fireEvent.change(input, { target: { value: 'te' } });
    fireEvent.change(input, { target: { value: 'test' } });
    expect(onFloatingFilterChanged).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(FLOATING_FILTER_DEBOUNCE_MS);
    });

    expect(onFloatingFilterChanged).toHaveBeenCalledTimes(1);
    expect(onFloatingFilterChanged).toHaveBeenCalledWith('contains', 'test');
  });

  test('reflects each keystroke in the input immediately even while debouncing', () => {
    const props = {
      parentFilterInstance: vi.fn(),
      currentParentModel: () => ({ filter: '' }),
    } as any;
    render(<FloatingFilter {...props} />);
    const input = screen.getByPlaceholderText(BasicI18nKey.Search);

    fireEvent.change(input, { target: { value: 'abc' } });
    expect(input).toHaveValue('abc');
  });

  test('input value reflects currentParentModel', () => {
    const props = {
      parentFilterInstance: vi.fn(),
      currentParentModel: () => ({ filter: 'xyz' }),
    } as any;
    render(<FloatingFilter {...props} />);
    expect(screen.getByDisplayValue('xyz')).toBeInTheDocument();
  });

  test('pending debounce survives a parent re-render', async () => {
    const onFloatingFilterChanged = vi.fn();
    const parentFilterInstance = (cb: any) => cb({ onFloatingFilterChanged });
    const makeProps = () =>
      ({
        parentFilterInstance,
        currentParentModel: () => ({ filter: '' }),
      }) as any;

    const { rerender } = render(<FloatingFilter {...makeProps()} />);
    const input = screen.getByPlaceholderText(BasicI18nKey.Search);

    fireEvent.change(input, { target: { value: 'abc' } });

    // Parent re-renders (new props identity) while debounce is still pending.
    rerender(<FloatingFilter {...makeProps()} />);

    act(() => {
      vi.advanceTimersByTime(FLOATING_FILTER_DEBOUNCE_MS);
    });

    expect(onFloatingFilterChanged).toHaveBeenCalledTimes(1);
    expect(onFloatingFilterChanged).toHaveBeenCalledWith('contains', 'abc');
  });
});
