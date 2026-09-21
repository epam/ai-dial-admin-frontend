import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ActionMenuOperationI18nKey, ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { MAX_ADDITIONAL_REQUESTS } from '@/src/utils/evaluation/request-chain';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import RequestsSidebar from '../RequestsSidebar';

const baseSuite: TestSuite = {
  id: 'suite-1',
  requestName: 'First request',
  additionalRequests: [{ name: 'Second request' }, {}],
};

const renderSidebar = (props?: Partial<React.ComponentProps<typeof RequestsSidebar>>) =>
  render(
    <RequestsSidebar
      testSuite={baseSuite}
      selectedIndex={0}
      onSelect={vi.fn()}
      onAdd={vi.fn()}
      onRemove={vi.fn()}
      onRename={vi.fn()}
      {...props}
    />,
  );

const getActionsTrigger = (rowIndex: number) =>
  screen.getAllByRole('button', { name: ButtonsI18nKey.Actions })[rowIndex];

describe('RequestsSidebar', () => {
  test('renders one row per request, falling back to a numbered label when unnamed', () => {
    renderSidebar();

    expect(screen.getByText('First request')).toBeInTheDocument();
    expect(screen.getByText('Second request')).toBeInTheDocument();
    expect(screen.getByText(`${TestSuitesI18nKey.Request} 3`)).toBeInTheDocument();
  });

  test('calls onSelect when a row is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderSidebar({ onSelect });

    await user.click(screen.getByRole('tab', { name: 'Second request' }));

    expect(onSelect).toHaveBeenCalledWith(1);
  });

  test('calls onAdd when the Add button is clicked', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    renderSidebar({ onAdd });

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Add }));

    expect(onAdd).toHaveBeenCalled();
  });

  test('every row offers a Rename action, including the first request', async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(getActionsTrigger(0));

    expect(screen.getByRole('menuitem', { name: ActionMenuOperationI18nKey.Rename })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: ActionMenuOperationI18nKey.Delete })).not.toBeInTheDocument();
  });

  test('calls onRename with the row index and the confirmed name from the rename modal', async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    renderSidebar({ onRename });

    await user.click(getActionsTrigger(1));
    await user.click(screen.getByRole('menuitem', { name: ActionMenuOperationI18nKey.Rename }));

    // DialInput remounts on re-render, so per-keystroke typing detaches; set the value in one change event.
    fireEvent.change(screen.getByDisplayValue('Second request'), { target: { value: 'Renamed' } });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Confirm }));

    expect(onRename).toHaveBeenCalledWith(1, 'Renamed');
  });

  test('calls onRemove with the row index when Delete is chosen for a non-first request', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    renderSidebar({ onRemove });

    await user.click(getActionsTrigger(1));
    await user.click(screen.getByRole('menuitem', { name: ActionMenuOperationI18nKey.Delete }));

    expect(onRemove).toHaveBeenCalledWith(1);
  });

  test('does not offer a Delete action for the first request', async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(getActionsTrigger(0));

    expect(screen.queryByRole('menuitem', { name: ActionMenuOperationI18nKey.Delete })).not.toBeInTheDocument();
  });

  test('marks the selected request row as active', () => {
    renderSidebar({ selectedIndex: 1 });

    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Second request');
  });

  test('disables row selection, add, and the row actions menu when disabled', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderSidebar({ selectedIndex: 1, disabled: true, onSelect });

    await user.click(screen.getByRole('tab', { name: 'First request' }));

    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeDisabled();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Actions })).not.toBeInTheDocument();
  });

  test('disables the add request button at the max additional request count', () => {
    const fullSuite: TestSuite = {
      ...baseSuite,
      additionalRequests: Array.from({ length: MAX_ADDITIONAL_REQUESTS }, (_, i) => ({ name: `Request ${i}` })),
    };
    renderSidebar({ testSuite: fullSuite });

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Add })).toBeDisabled();
  });
});
