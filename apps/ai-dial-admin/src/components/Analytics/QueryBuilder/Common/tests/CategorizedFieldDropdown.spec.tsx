import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import CategorizedFieldDropdown from '@/src/components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown';
import { FieldOption } from '@/src/models/analytics/query-builder';

const OPTIONS: FieldOption[] = [
  { name: 'total_price', type: 'decimal', tag: 'cost' },
  { name: 'deployment', type: 'string', tag: 'dimension' },
  { name: 'total_tokens', type: 'long', tag: 'cost' },
];

const UNTAGGED_OPTIONS: FieldOption[] = [
  { name: 'alias_a', type: 'decimal' },
  { name: 'alias_b', type: 'timestamp' },
];

describe('QueryBuilder :: CategorizedFieldDropdown', () => {
  test('opens on trigger click and lists options grouped by tag', async () => {
    const user = userEvent.setup();
    render(
      <CategorizedFieldDropdown
        id="test"
        options={OPTIONS}
        onSelect={vi.fn()}
        addLabel="+ Add"
        ariaLabel="Add field"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Add field' }));

    expect(screen.getByText('cost')).toBeInTheDocument();
    expect(screen.getByText('dimension')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /total_price/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /deployment/ })).toBeInTheDocument();
  });

  test('search narrows visible options and shows empty state for no match', async () => {
    const user = userEvent.setup();
    render(
      <CategorizedFieldDropdown
        id="test"
        options={OPTIONS}
        onSelect={vi.fn()}
        addLabel="+ Add"
        ariaLabel="Add field"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Add field' }));
    await user.type(screen.getByRole('textbox'), 'deploy');

    expect(screen.getByRole('option', { name: /deployment/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /total_price/ })).not.toBeInTheDocument();

    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'zzz');
    expect(screen.getByText('QueryBuilder.NoMatchingFields')).toBeInTheDocument();
  });

  test('selecting an option fires onSelect and closes the overlay', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <CategorizedFieldDropdown
        id="test"
        options={OPTIONS}
        onSelect={onSelect}
        addLabel="+ Add"
        ariaLabel="Add field"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Add field' }));
    await user.click(screen.getByRole('option', { name: /deployment/ }));

    expect(onSelect).toHaveBeenCalledWith('deployment');
    expect(screen.queryByRole('option', { name: /deployment/ })).not.toBeInTheDocument();
  });

  test('untagged-only options render flat without a group header', async () => {
    const user = userEvent.setup();
    render(
      <CategorizedFieldDropdown
        id="test"
        options={UNTAGGED_OPTIONS}
        onSelect={vi.fn()}
        value="alias_a"
        placeholder="pick"
        ariaLabel="Pick field"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Pick field' }));

    expect(screen.queryByText('QueryBuilder.Untagged')).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: /alias_b/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /alias_a/ })).toHaveAttribute('aria-selected', 'true');
  });

  test('picker mode shows the current value on the trigger', () => {
    render(
      <CategorizedFieldDropdown
        id="test"
        options={OPTIONS}
        onSelect={vi.fn()}
        value="deployment"
        placeholder="pick"
        ariaLabel="Pick field"
      />,
    );

    expect(screen.getByRole('button', { name: 'Pick field' })).toHaveTextContent('deployment');
  });
});
