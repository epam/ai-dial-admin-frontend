import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { MAX_ADDITIONAL_REQUESTS } from '@/src/utils/evaluation/request-chain';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import RequestChainSelector from '../RequestChainSelector';

const baseSuite: TestSuite = {
  id: 'suite-1',
  requestName: 'First request',
  additionalRequests: [{ name: 'Second request' }, {}],
};

describe('RequestChainSelector', () => {
  test('renders one chip per request', () => {
    render(
      <RequestChainSelector
        testSuite={baseSuite}
        selectedIndex={0}
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText('1. First request')).toBeInTheDocument();
    expect(screen.getByText('2. Second request')).toBeInTheDocument();
    expect(screen.getByText(`3. ${TestSuitesI18nKey.Request}`)).toBeInTheDocument();
  });

  test('calls onSelect when a chip is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <RequestChainSelector
        testSuite={baseSuite}
        selectedIndex={0}
        onSelect={onSelect}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    await user.click(screen.getByText('2. Second request'));

    expect(onSelect).toHaveBeenCalledWith(1);
  });

  test('calls onAdd when add request button is clicked', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(
      <RequestChainSelector
        testSuite={baseSuite}
        selectedIndex={0}
        onSelect={vi.fn()}
        onAdd={onAdd}
        onRemove={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: TestSuitesI18nKey.AddRequest }));

    expect(onAdd).toHaveBeenCalled();
  });

  test('calls onRemove with the chip index when removed', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <RequestChainSelector
        testSuite={baseSuite}
        selectedIndex={0}
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />,
    );

    const removeButtons = screen.getAllByRole('button', { name: TestSuitesI18nKey.RemoveRequest });
    await user.click(removeButtons[0]);

    expect(onRemove).toHaveBeenCalledWith(1);
  });

  test('does not render a remove affordance for the first chip', () => {
    render(
      <RequestChainSelector
        testSuite={baseSuite}
        selectedIndex={0}
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    const removeButtons = screen.getAllByRole('button', { name: TestSuitesI18nKey.RemoveRequest });
    expect(removeButtons).toHaveLength(2);
  });

  test('does not call onSelect when disabled', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <RequestChainSelector
        testSuite={baseSuite}
        selectedIndex={0}
        disabled
        onSelect={onSelect}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    await user.click(screen.getByText('2. Second request'));

    expect(onSelect).not.toHaveBeenCalled();
  });

  test('does not render remove affordances when disabled', () => {
    render(
      <RequestChainSelector
        testSuite={baseSuite}
        selectedIndex={0}
        disabled
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: TestSuitesI18nKey.RemoveRequest })).not.toBeInTheDocument();
  });

  test('disables the add request button at the max additional request count', () => {
    const fullSuite: TestSuite = {
      ...baseSuite,
      additionalRequests: Array.from({ length: MAX_ADDITIONAL_REQUESTS }, (_, i) => ({ name: `Request ${i}` })),
    };
    render(
      <RequestChainSelector
        testSuite={fullSuite}
        selectedIndex={0}
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: TestSuitesI18nKey.AddRequest })).toBeDisabled();
  });

  test('renders the hint text', () => {
    render(
      <RequestChainSelector
        testSuite={baseSuite}
        selectedIndex={0}
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText(TestSuitesI18nKey.RequestChainHint)).toBeInTheDocument();
  });
});
