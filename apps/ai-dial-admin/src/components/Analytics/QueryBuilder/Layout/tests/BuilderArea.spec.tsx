import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import BuilderArea from '@/src/components/Analytics/QueryBuilder/Layout/BuilderArea';

const STORAGE_KEY = 'query-builder-area-height';
const PARENT_HEIGHT = 500;
const MAX_HEIGHT = 300;
const MIN_HEIGHT = 56;
const DEFAULT_HEIGHT = 120;
const STEP = 16;

describe('BuilderArea', () => {
  const renderArea = () =>
    render(
      <BuilderArea ariaLabel="Resize builder">
        <p>Chips</p>
      </BuilderArea>,
    );

  const handle = () => screen.getByRole('separator', { name: 'Resize builder' });

  const press = async (keys: string) => {
    const user = userEvent.setup();
    handle().focus();
    await user.keyboard(keys);
  };

  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(PARENT_HEIGHT);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders its content above a horizontal separator that reports the height and its bounds', () => {
    renderArea();

    expect(screen.getByText('Chips')).toBeInTheDocument();
    expect(handle()).toHaveAttribute('aria-orientation', 'horizontal');
    expect(handle()).toHaveAttribute('aria-valuenow', String(DEFAULT_HEIGHT));
    expect(handle()).toHaveAttribute('aria-valuemin', String(MIN_HEIGHT));
    expect(handle()).toHaveAttribute('aria-valuemax', String(MAX_HEIGHT));
    expect(handle()).toHaveAttribute('tabindex', '0');
  });

  test('grows by one step on ArrowDown and persists the height', async () => {
    renderArea();

    await press('{ArrowDown}');

    expect(handle()).toHaveAttribute('aria-valuenow', String(DEFAULT_HEIGHT + STEP));
    expect(localStorage.getItem(STORAGE_KEY)).toBe(String(DEFAULT_HEIGHT + STEP));
  });

  test('shrinks by one step on ArrowUp and persists the height', async () => {
    renderArea();

    await press('{ArrowUp}');

    expect(handle()).toHaveAttribute('aria-valuenow', String(DEFAULT_HEIGHT - STEP));
    expect(localStorage.getItem(STORAGE_KEY)).toBe(String(DEFAULT_HEIGHT - STEP));
  });

  test('jumps to the minimum on Home and stays there on ArrowUp', async () => {
    renderArea();

    await press('{Home}');
    expect(handle()).toHaveAttribute('aria-valuenow', String(MIN_HEIGHT));

    await press('{ArrowUp}');

    expect(handle()).toHaveAttribute('aria-valuenow', String(MIN_HEIGHT));
    expect(localStorage.getItem(STORAGE_KEY)).toBe(String(MIN_HEIGHT));
  });

  test('jumps to the maximum on End and stays there on ArrowDown', async () => {
    renderArea();

    await press('{End}');
    expect(handle()).toHaveAttribute('aria-valuenow', String(MAX_HEIGHT));

    await press('{ArrowDown}');

    expect(handle()).toHaveAttribute('aria-valuenow', String(MAX_HEIGHT));
    expect(localStorage.getItem(STORAGE_KEY)).toBe(String(MAX_HEIGHT));
  });

  test('ignores other keys and stores nothing', async () => {
    renderArea();

    await press('{ArrowLeft}{Enter}');

    expect(handle()).toHaveAttribute('aria-valuenow', String(DEFAULT_HEIGHT));
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  test('restores the stored height', () => {
    localStorage.setItem(STORAGE_KEY, '200');
    renderArea();

    expect(handle()).toHaveAttribute('aria-valuenow', '200');
  });

  test.each([
    ['above the maximum', '900', MAX_HEIGHT],
    ['below the minimum', '10', MIN_HEIGHT],
    ['that is not a number', 'tall', DEFAULT_HEIGHT],
    ['of zero', '0', DEFAULT_HEIGHT],
  ])('clamps or ignores a stored height %s', (_case, stored, expected) => {
    localStorage.setItem(STORAGE_KEY, stored);
    renderArea();

    expect(handle()).toHaveAttribute('aria-valuenow', String(expected));
  });

  test('never offers less than the minimum height when its container is short', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(40);
    renderArea();

    expect(handle()).toHaveAttribute('aria-valuemax', String(MIN_HEIGHT));

    await press('{ArrowDown}');

    expect(handle()).toHaveAttribute('aria-valuenow', String(MIN_HEIGHT));
  });
});
