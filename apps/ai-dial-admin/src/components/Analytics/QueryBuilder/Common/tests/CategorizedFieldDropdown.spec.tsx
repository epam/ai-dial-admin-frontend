import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import CategorizedFieldDropdown from '@/src/components/Analytics/QueryBuilder/Common/CategorizedFieldDropdown';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
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
          { name: 'date_bin', hint: 'time bucket' },
          { name: 'lower', hint: 'lowercase' },
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
        functions={[{ name: 'lower', hint: 'lowercase' }]}
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

  test('labeled option renders label, description, and type; selection returns the raw name', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <CategorizedFieldDropdown
        id="test"
        options={[
          ...OPTIONS,
          {
            name: 'total_money',
            type: 'decimal',
            tag: 'cost',
            display_name: 'Total money spend',
            description: 'Money spent on the request',
          },
        ]}
        onSelect={onSelect}
        addLabel="+ Add"
        ariaLabel="Add field"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Add field' }));
    await user.click(screen.getByRole('button', { name: /cost/ }));

    const option = screen.getByRole('option', { name: /Total money spend/ });
    expect(option).toHaveTextContent('Money spent on the request');
    expect(option).toHaveTextContent('decimal');
    expect(option).not.toHaveTextContent('total_money');
    // Unlabeled options in the same group keep their single-line name rendering.
    expect(screen.getByRole('option', { name: /total_price/ })).not.toHaveTextContent('Money spent');

    await user.click(option);
    expect(onSelect).toHaveBeenCalledWith('total_money');
  });

  test('search matches by label', async () => {
    const user = userEvent.setup();
    render(
      <CategorizedFieldDropdown
        id="test"
        options={[...OPTIONS, { name: 'total_money', type: 'decimal', tag: 'cost', display_name: 'Total money spend' }]}
        onSelect={vi.fn()}
        addLabel="+ Add"
        ariaLabel="Add field"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Add field' }));
    await user.type(screen.getByRole('textbox'), 'money spend');

    expect(screen.getByRole('option', { name: /Total money spend/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /deployment/ })).not.toBeInTheDocument();
  });

  test('sensitive options render the sensitive indicator, others do not', async () => {
    const user = userEvent.setup();
    render(
      <CategorizedFieldDropdown
        id="test"
        options={[
          { name: 'email', type: 'string', sensitive: true },
          { name: 'total', type: 'decimal' },
        ]}
        onSelect={vi.fn()}
        addLabel="+ Add"
        ariaLabel="Add field"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Add field' }));

    const sensitiveOption = screen.getByRole('option', { name: /email/ });
    expect(within(sensitiveOption).getByRole('img', { name: AnalyticsTablesI18nKey.Sensitive })).toBeInTheDocument();
    const plainOption = screen.getByRole('option', { name: /total/ });
    expect(within(plainOption).queryByRole('img')).not.toBeInTheDocument();
  });

  test('picker-mode trigger shows the selected field label', () => {
    render(
      <CategorizedFieldDropdown
        id="test"
        options={[{ name: 'total_money', type: 'decimal', tag: 'cost', display_name: 'Total money spend' }]}
        onSelect={vi.fn()}
        value="total_money"
        placeholder="pick"
        ariaLabel="Pick field"
      />,
    );

    expect(screen.getByRole('button', { name: 'Pick field' })).toHaveTextContent('Total money spend');
  });
});
