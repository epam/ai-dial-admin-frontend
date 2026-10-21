import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import SplitPane from '@/src/components/Common/SplitPane/SplitPane';
import {
  DEFAULT_SPLIT_PERCENT,
  MIN_SPLIT_PERCENT,
  SPLIT_STEP_PERCENT,
} from '@/src/components/Common/SplitPane/constants';

const LABEL = 'Resize the sections';

const renderSplit = (minPercent?: number) =>
  render(
    <SplitPane ariaLabel={LABEL} minPercent={minPercent} top={<p>tree section</p>} bottom={<p>bodies section</p>} />,
  );

// Queried by role only: `re-resizable` renders its own wrapper element, so a structural query would break on
// a library upgrade rather than on a behaviour change.
const separator = () => screen.getByRole('separator', { name: LABEL });

describe('SplitPane', () => {
  test('renders both sections and the separator between them', () => {
    renderSplit();

    expect(screen.getByText('tree section')).toBeTruthy();
    expect(screen.getByText('bodies section')).toBeTruthy();
    expect(separator()).toBeTruthy();
  });

  test('opens at half the region and reports both floors', () => {
    renderSplit();

    expect(separator()).toHaveAttribute('aria-valuenow', String(DEFAULT_SPLIT_PERCENT));
    expect(separator()).toHaveAttribute('aria-valuemin', String(MIN_SPLIT_PERCENT));
    expect(separator()).toHaveAttribute('aria-valuemax', String(100 - MIN_SPLIT_PERCENT));
    expect(separator()).toHaveAttribute('aria-orientation', 'horizontal');
  });

  test('grows the top section on ArrowDown and shrinks it on ArrowUp', async () => {
    const user = userEvent.setup();
    renderSplit();

    await user.click(separator());
    await user.keyboard('{ArrowDown}');
    expect(separator()).toHaveAttribute('aria-valuenow', String(DEFAULT_SPLIT_PERCENT + SPLIT_STEP_PERCENT));

    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(separator()).toHaveAttribute('aria-valuenow', String(DEFAULT_SPLIT_PERCENT - SPLIT_STEP_PERCENT));
  });

  test('reaches each floor with Home and End and goes no further', async () => {
    const user = userEvent.setup();
    renderSplit();

    await user.click(separator());
    await user.keyboard('{Home}{Home}');
    expect(separator()).toHaveAttribute('aria-valuenow', String(MIN_SPLIT_PERCENT));

    await user.keyboard('{End}{End}');
    expect(separator()).toHaveAttribute('aria-valuenow', String(100 - MIN_SPLIT_PERCENT));
  });

  test('never drives a section below the floor, however many steps are taken', async () => {
    const user = userEvent.setup();
    renderSplit();

    await user.click(separator());
    await user.keyboard('{ArrowUp>12/}');

    expect(separator()).toHaveAttribute('aria-valuenow', String(MIN_SPLIT_PERCENT));
  });

  test('honours a caller’s own floor', () => {
    renderSplit(35);

    expect(separator()).toHaveAttribute('aria-valuemin', '35');
    expect(separator()).toHaveAttribute('aria-valuemax', '65');
  });

  test('is reachable by keyboard', async () => {
    const user = userEvent.setup();
    renderSplit();

    await user.tab();

    expect(separator()).toHaveFocus();
  });
});
