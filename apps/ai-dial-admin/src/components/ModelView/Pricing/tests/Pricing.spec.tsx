import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { BasicI18nKey, ModelViewI18nKey } from '@/src/constants/i18n';
import { DialModelPricing, PricingType } from '@/src/models/dial/model';
import Pricing from '../Pricing';

const isReadOnlyAdminMock = vi.fn(() => false);

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: () => isReadOnlyAdminMock(),
}));

// Only the select is replaced — the real DialNumberInput is kept so the price fields behave as they
// do in the app (a cleared field emits null, which is what distinguishes "unset" from "0").
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

interface TestModel {
  pricing?: DialModelPricing;
}

describe('Pricing', () => {
  const renderPricing = (pricing?: DialModelPricing, onChangeModel = vi.fn()) => {
    render(<Pricing<TestModel> model={{ pricing }} onChangeModel={onChangeModel} />);
    return onChangeModel;
  };

  const tokenPricing: DialModelPricing = {
    unit: PricingType.Token,
    prompt: '0.0000008',
    completion: '0.0000009',
    cacheRead: '0.0000002',
    cacheWrite: '0.0000003',
  };

  const cacheReadField = () => screen.getByRole('spinbutton', { name: ModelViewI18nKey.CacheReadPrice });
  const cacheWriteField = () => screen.getByRole('spinbutton', { name: ModelViewI18nKey.CacheWritePrice });

  beforeEach(() => {
    vi.clearAllMocks();
    isReadOnlyAdminMock.mockReturnValue(false);
  });

  test('renders a cache read and a cache write field alongside the existing rates', () => {
    renderPricing(tokenPricing);

    expect(screen.getByRole('spinbutton', { name: ModelViewI18nKey.PromptPrice })).toBeTruthy();
    expect(screen.getByRole('spinbutton', { name: ModelViewI18nKey.CompletionPrice })).toBeTruthy();
    expect(cacheReadField()).toBeTruthy();
    expect(cacheWriteField()).toBeTruthy();
  });

  test('displays stored cache rates scaled per million under the token unit', () => {
    renderPricing(tokenPricing);

    expect(cacheReadField()).toHaveValue(0.2);
    expect(cacheWriteField()).toHaveValue(0.3);
  });

  test('enables the cache rate fields under the token unit', () => {
    renderPricing(tokenPricing);

    expect(cacheReadField()).toBeEnabled();
    expect(cacheWriteField()).toBeEnabled();
  });

  test('disables the cache rate fields under the character unit', () => {
    renderPricing({ unit: PricingType.CharWithoutWhitespace, prompt: '0.1' });

    expect(cacheReadField()).toBeDisabled();
    expect(cacheWriteField()).toBeDisabled();
  });

  test('disables the cache rate fields when no cost unit is set', () => {
    renderPricing();

    expect(cacheReadField()).toBeDisabled();
    expect(cacheWriteField()).toBeDisabled();
  });

  test('disables the cache rate fields for a read-only administrator', () => {
    isReadOnlyAdminMock.mockReturnValue(true);
    renderPricing(tokenPricing);

    expect(cacheReadField()).toBeDisabled();
    expect(cacheWriteField()).toBeDisabled();
  });

  test('stores an entered cache read rate per token', async () => {
    const user = userEvent.setup();
    const onChangeModel = renderPricing({ unit: PricingType.Token });

    await user.type(cacheReadField(), '0.8');

    // The float artifact is what dividing by 1e6 produces, and is shared with the prompt and
    // completion rates; it scales back to a clean 0.8 for display.
    expect(onChangeModel).toHaveBeenLastCalledWith({
      pricing: { unit: PricingType.Token, cacheRead: '8.000000000000001e-7' },
    });
  });

  test('omits a cleared cache write rate instead of storing zero', async () => {
    const user = userEvent.setup();
    const onChangeModel = renderPricing(tokenPricing);

    await user.clear(cacheWriteField());

    expect(onChangeModel).toHaveBeenLastCalledWith({
      pricing: { ...tokenPricing, cacheWrite: undefined },
    });
  });

  test('stores an explicit zero cache write rate as a zero string', async () => {
    const user = userEvent.setup();
    const onChangeModel = renderPricing({ unit: PricingType.Token });

    await user.type(cacheWriteField(), '0');

    expect(onChangeModel).toHaveBeenLastCalledWith({
      pricing: { unit: PricingType.Token, cacheWrite: '0' },
    });
  });

  test('clears every rate when the cost unit changes', async () => {
    const user = userEvent.setup();
    const onChangeModel = renderPricing(tokenPricing);

    await user.selectOptions(screen.getByRole('combobox'), PricingType.CharWithoutWhitespace);

    expect(onChangeModel).toHaveBeenCalledWith({
      pricing: { unit: PricingType.CharWithoutWhitespace },
    });
  });

  test('leaves no pricing behind when the cost unit is cleared', async () => {
    const user = userEvent.setup();
    const onChangeModel = renderPricing(tokenPricing);

    await user.selectOptions(screen.getByRole('combobox'), BasicI18nKey.None);

    expect(onChangeModel).toHaveBeenCalledWith({ pricing: undefined });
  });
});
