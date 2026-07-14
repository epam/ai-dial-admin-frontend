import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import CategorizedFieldDropdown from '@/src/components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown';
import { QueryScalarFn } from '@/src/models/analytics/query';
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
  test('opens with collapsed tag groups showing counts; expanding a group reveals its options', async () => {
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

    const costHeader = screen.getByRole('button', { name: /cost/ });
    expect(costHeader).toHaveAttribute('aria-expanded', 'false');
    expect(costHeader).toHaveTextContent('2');
    expect(screen.queryByRole('option', { name: /total_price/ })).not.toBeInTheDocument();

    await user.click(costHeader);
    expect(screen.getByRole('option', { name: /total_price/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /total_tokens/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /deployment/ })).not.toBeInTheDocument();

    // Accordion: opening another category closes the previous one.
    await user.click(screen.getByRole('button', { name: /dimension/ }));
    expect(screen.getByRole('option', { name: /deployment/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /total_price/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /dimension/ }));
    expect(screen.queryByRole('option', { name: /deployment/ })).not.toBeInTheDocument();
  });

  test('the group holding the current value starts expanded', async () => {
    const user = userEvent.setup();
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

    await user.click(screen.getByRole('button', { name: 'Pick field' }));

    expect(screen.getByRole('option', { name: /deployment/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('option', { name: /total_price/ })).not.toBeInTheDocument();
  });

  test('functions render in their own group and fire onSelectFunction', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onSelectFunction = vi.fn();
    render(
      <CategorizedFieldDropdown
        id="test"
        options={OPTIONS}
        onSelect={onSelect}
        functions={[
          { name: QueryScalarFn.DateBin, hint: 'time bucket' },
          { name: QueryScalarFn.Lower, hint: 'lowercase' },
        ]}
        onSelectFunction={onSelectFunction}
        addLabel="+ Add"
        ariaLabel="Add field"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Add field' }));

    expect(screen.getByText('QueryBuilder.Columns')).toBeInTheDocument();
    const fnHeader = screen.getByRole('button', { name: /QueryBuilder.Functions/ });
    await user.click(fnHeader);
    await user.click(screen.getByRole('option', { name: /date_bin/ }));

    expect(onSelectFunction).toHaveBeenCalledWith('date_bin');
    expect(onSelect).not.toHaveBeenCalled();
  });

  test('searching matches functions by name and hint alongside columns', async () => {
    const user = userEvent.setup();
    render(
      <CategorizedFieldDropdown
        id="test"
        options={OPTIONS}
        onSelect={vi.fn()}
        functions={[{ name: QueryScalarFn.Lower, hint: 'lowercase' }]}
        onSelectFunction={vi.fn()}
        addLabel="+ Add"
        ariaLabel="Add field"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Add field' }));
    await user.type(screen.getByRole('textbox'), 'lowerc');

    expect(screen.getByRole('option', { name: /lower/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /deployment/ })).not.toBeInTheDocument();
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
    await user.click(screen.getByRole('button', { name: /dimension/ }));
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
