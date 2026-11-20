import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import DebouncedToolsSearch from '@/src/components/Tools/DebouncedToolsSearch';

afterEach(() => vi.useRealTimers());

describe('DebouncedToolsSearch', () => {
  test('clears pending state when input returns to the settled term', async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const onPendingChange = vi.fn();
    render(<DebouncedToolsSearch value="" onChange={onChange} onPendingChange={onPendingChange} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'weather' } });
    expect(onPendingChange).toHaveBeenLastCalledWith(true);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
    expect(onPendingChange).toHaveBeenLastCalledWith(false);
    await act(async () => vi.advanceTimersByTimeAsync(300));
    expect(onChange).not.toHaveBeenCalled();
  });

  test('cancels an outstanding search on unmount', async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const onPendingChange = vi.fn();
    const { unmount } = render(<DebouncedToolsSearch value="" onChange={onChange} onPendingChange={onPendingChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'weather' } });
    expect(onPendingChange).toHaveBeenLastCalledWith(true);

    unmount();
    await act(async () => vi.advanceTimersByTimeAsync(300));
    expect(onChange).not.toHaveBeenCalled();
  });
});
