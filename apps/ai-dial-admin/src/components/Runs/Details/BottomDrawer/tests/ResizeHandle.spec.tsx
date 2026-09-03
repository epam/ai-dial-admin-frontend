import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import ResizeHandle from '@/src/components/Runs/Details/BottomDrawer/ResizeHandle';
import {
  DRAWER_COARSE_STEP_HEIGHT,
  DRAWER_STEP_HEIGHT,
  MIN_DRAWER_HEIGHT,
} from '@/src/components/Runs/Details/BottomDrawer/constants';

const MAX_HEIGHT = 800;

const renderHandle = (props: Partial<Parameters<typeof ResizeHandle>[0]> = {}) => {
  const onChangeHeight = vi.fn();

  render(
    <ResizeHandle
      height={400}
      minHeight={MIN_DRAWER_HEIGHT}
      maxHeight={MAX_HEIGHT}
      onChangeHeight={onChangeHeight}
      {...props}
    />,
  );

  return { onChangeHeight };
};

const handle = () => screen.getByRole('separator', { name: 'Runs.ResizeDrawerLabel' });

describe('ResizeHandle', () => {
  // The separator carries its value so a reader who cannot see the panel move is still told what size it is
  // now, and what the two ends of the range are.
  test('reports the drawer size and its range as a focusable window splitter', async () => {
    const user = userEvent.setup();
    renderHandle();

    await user.tab();

    expect(handle()).toHaveFocus();
    expect(handle()).toHaveAttribute('aria-orientation', 'horizontal');
    expect(handle()).toHaveAttribute('aria-valuenow', '400');
    expect(handle()).toHaveAttribute('aria-valuemin', String(MIN_DRAWER_HEIGHT));
    expect(handle()).toHaveAttribute('aria-valuemax', String(MAX_HEIGHT));
  });

  // The drawer is anchored to the bottom and resized from its top edge, so up grows it — the edge moves the
  // way the key points.
  test('grows the drawer by one step on Arrow Up', async () => {
    const user = userEvent.setup();
    const { onChangeHeight } = renderHandle();

    await user.tab();
    await user.keyboard('{ArrowUp}');

    expect(onChangeHeight).toHaveBeenCalledWith(400 + DRAWER_STEP_HEIGHT);
  });

  test('shrinks the drawer by one step on Arrow Down', async () => {
    const user = userEvent.setup();
    const { onChangeHeight } = renderHandle();

    await user.tab();
    await user.keyboard('{ArrowDown}');

    expect(onChangeHeight).toHaveBeenCalledWith(400 - DRAWER_STEP_HEIGHT);
  });

  // The coarse step is what makes the range crossable: at 20px a reader dragging the drawer from its minimum
  // to a tall window would be holding the key for dozens of presses.
  test('takes the coarse step when the arrow is shifted', async () => {
    const user = userEvent.setup();
    const { onChangeHeight } = renderHandle();

    await user.tab();
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}');

    expect(onChangeHeight).toHaveBeenCalledWith(400 + DRAWER_COARSE_STEP_HEIGHT);

    await user.keyboard('{Shift>}{ArrowDown}{/Shift}');

    expect(onChangeHeight).toHaveBeenCalledWith(400 - DRAWER_COARSE_STEP_HEIGHT);
  });

  test('stops at the minimum rather than passing it', async () => {
    const user = userEvent.setup();
    const { onChangeHeight } = renderHandle({ height: MIN_DRAWER_HEIGHT + 10 });

    await user.tab();
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}');

    expect(onChangeHeight).toHaveBeenCalledWith(MIN_DRAWER_HEIGHT);
  });

  test('stops at the maximum rather than passing it', async () => {
    const user = userEvent.setup();
    const { onChangeHeight } = renderHandle({ height: MAX_HEIGHT - 10 });

    await user.tab();
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}');

    expect(onChangeHeight).toHaveBeenCalledWith(MAX_HEIGHT);
  });

  test('answers Home with the smallest drawer and End with the largest', async () => {
    const user = userEvent.setup();
    const { onChangeHeight } = renderHandle();

    await user.tab();
    await user.keyboard('{Home}');

    expect(onChangeHeight).toHaveBeenCalledWith(MIN_DRAWER_HEIGHT);

    await user.keyboard('{End}');

    expect(onChangeHeight).toHaveBeenCalledWith(MAX_HEIGHT);
  });

  test('leaves a key it does not claim to the drawer below it', async () => {
    const user = userEvent.setup();
    const { onChangeHeight } = renderHandle();

    await user.tab();
    await user.keyboard('{PageDown}');

    expect(onChangeHeight).not.toHaveBeenCalled();
  });

  // The maximum is derived from the viewport, so a height stored at a taller window outlives the window it
  // was chosen in. It is reported as the size the drawer is actually at, not the one it remembers.
  test('reports a stored height taller than the current window as the window allows', () => {
    renderHandle({ height: 2000 });

    expect(handle()).toHaveAttribute('aria-valuenow', String(MAX_HEIGHT));
  });
});
