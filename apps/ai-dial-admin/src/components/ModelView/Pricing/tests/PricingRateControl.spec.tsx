import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ModelViewI18nKey } from '@/src/constants/i18n';
import { PricingOperator, PricingRate } from '@/src/models/dial/model';
import PricingRateControl from '../PricingRateControl';

// Same replacement as Pricing.spec.tsx: a native select stays queryable as a combobox with options.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@epam/ai-dial-ui-kit')>()),
  DialSelectField: ({ id, label, value, options, onChange, disabled }: any) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

const testNode = (field = 'ttl'): PricingRate => ({
  test: { field, operator: PricingOperator.EQ, value: '1h' },
  ifTrue: '6',
  ifFalse: '3.75',
});

describe('PricingRateControl', () => {
  const renderControl = (value: PricingRate | undefined, onChange = vi.fn(), disabled?: boolean) =>
    render(
      <PricingRateControl
        elementId="cacheReadPrice"
        label="Cache read price"
        value={value}
        disabled={disabled}
        onChange={onChange}
      />,
    );

  const fieldInput = () => screen.getByRole('textbox', { name: ModelViewI18nKey.Field });
  const ifTrueInput = () => screen.getByRole('spinbutton', { name: ModelViewI18nKey.IfTrue });

  test('renders a flat rate input with a conditional-mode toggle', () => {
    renderControl('3');

    expect(screen.getByRole('spinbutton', { name: 'Cache read price' })).toHaveValue(3);
    expect(screen.getByRole('button', { name: ModelViewI18nKey.ConfigureConditional })).toBeTruthy();
  });

  test('converting a flat rate seeds both branches with the current value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderControl('3', onChange);

    await user.click(screen.getByRole('button', { name: ModelViewI18nKey.ConfigureConditional }));

    expect(onChange).toHaveBeenCalledWith({
      test: { field: '', operator: PricingOperator.EQ, value: '' },
      ifTrue: '3',
      ifFalse: '3',
    });
  });

  test('converting an unset flat rate seeds empty branches', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderControl(undefined, onChange);

    await user.click(screen.getByRole('button', { name: ModelViewI18nKey.ConfigureConditional }));

    expect(onChange).toHaveBeenCalledWith({
      test: { field: '', operator: PricingOperator.EQ, value: '' },
      ifTrue: '',
      ifFalse: '',
    });
  });

  test('renders the test row and both branches for a tree value', () => {
    renderControl(testNode());

    expect(fieldInput()).toBeTruthy();
    expect(screen.getByRole('combobox')).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Basic.Value' })).toBeTruthy();
    expect(ifTrueInput()).toHaveValue(6);
    expect(screen.getByRole('spinbutton', { name: ModelViewI18nKey.IfFalse })).toHaveValue(3.75);
  });

  test('offers all six operators for a numeric standard field', () => {
    renderControl(testNode('cachedReadTokens'));

    expect(screen.getAllByRole('option').map((option) => option.getAttribute('value'))).toEqual(
      Object.values(PricingOperator),
    );
  });

  test('offers only the equality operators for a string-typed standard field', () => {
    renderControl(testNode('ttl'));

    expect(screen.getAllByRole('option').map((option) => option.getAttribute('value'))).toEqual([
      PricingOperator.EQ,
      PricingOperator.NE,
    ]);
  });

  test('resets the operator to equality when the field becomes string-typed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderControl(
      {
        test: { field: 'cachedReadTokens', operator: PricingOperator.GT, value: '1024' },
        ifTrue: '6',
        ifFalse: '4',
      },
      onChange,
    );

    await user.type(fieldInput(), 'serviceTier');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenLastCalledWith({
      test: { field: 'serviceTier', operator: PricingOperator.EQ, value: '1024' },
      ifTrue: '6',
      ifFalse: '4',
    });
  });

  test('commits a free-text JSONPath expression as the field', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderControl(testNode(), onChange);

    await user.type(fieldInput(), '$.usage.ttl');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        test: expect.objectContaining({ field: '$.usage.ttl' }),
      }),
    );
  });

  test('collapsing a tree keeps a flat if-true rate', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderControl(testNode(), onChange);

    await user.click(screen.getByRole('button', { name: ModelViewI18nKey.UseFlatRate }));

    expect(onChange).toHaveBeenCalledWith('6');
  });

  test('collapsing a tree with a nested if-true leaves the flat field empty', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderControl({ test: testNode().test, ifTrue: testNode('promptTokens') }, onChange);

    // The nested if-true tree renders its own collapse toggle; the first in the DOM is the top level.
    const [collapseToggle] = screen.getAllByRole('button', { name: ModelViewI18nKey.UseFlatRate });
    await user.click(collapseToggle);

    expect(onChange).toHaveBeenCalledWith('');
  });

  test('clearing a branch rate empties it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderControl({ test: testNode().test, ifTrue: '6' }, onChange);

    await user.clear(ifTrueInput());

    expect(onChange).toHaveBeenLastCalledWith({ test: testNode().test, ifTrue: '' });
  });

  test('typing into an empty branch rate updates the node', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderControl({ test: testNode().test, ifTrue: '' }, onChange);

    await user.type(ifTrueInput(), '9');

    expect(onChange).toHaveBeenLastCalledWith({ test: testNode().test, ifTrue: '9' });
  });

  test('toggling a branch to conditional nests a tree inside it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderControl(testNode(), onChange);

    // Both branches are flat, so each offers its own conditional toggle; the first is if-true.
    const [ifTrueToggle] = screen.getAllByRole('button', { name: ModelViewI18nKey.ConfigureConditional });
    await user.click(ifTrueToggle);

    expect(onChange).toHaveBeenLastCalledWith({
      test: testNode().test,
      ifTrue: {
        test: { field: '', operator: PricingOperator.EQ, value: '' },
        ifTrue: '6',
        ifFalse: '6',
      },
      ifFalse: '3.75',
    });
  });

  test('disables every control and hides the toggles when disabled', () => {
    renderControl(testNode(), vi.fn(), true);

    expect(screen.queryByRole('button', { name: ModelViewI18nKey.UseFlatRate })).toBeNull();
    expect(screen.queryByRole('button', { name: ModelViewI18nKey.ConfigureConditional })).toBeNull();
    expect(fieldInput()).toBeDisabled();
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Basic.Value' })).toBeDisabled();
    expect(ifTrueInput()).toBeDisabled();
  });
});
