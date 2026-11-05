import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ComponentProps, useState } from 'react';

import SpendingLimits from '@/src/components/SystemProperties/SpendingLimits';
import { SystemPropertiesI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { SpendingLimitMode, SpendingLimits as SpendingLimitsModel } from '@/src/models/system-properties';

const LIMITS: SpendingLimitsModel = { mode: SpendingLimitMode.Shadow, defaultCostObject: 'TEAM-A' };

const renderSpendingLimits = (props?: Partial<ComponentProps<typeof SpendingLimits>>) =>
  render(
    <SpendingLimits
      spendingLimits={props?.spendingLimits}
      onChangeSpendingLimits={props?.onChangeSpendingLimits ?? vi.fn()}
    />,
  );

// Keep the value controlled as it is on the page, so edits are reflected back into the controls.
const renderWithState = (initial?: SpendingLimitsModel) => {
  let latest: SpendingLimitsModel | undefined = initial;
  const Host = () => {
    const [limits, setLimits] = useState<SpendingLimitsModel | undefined>(initial);
    latest = limits;
    return <SpendingLimits spendingLimits={limits} onChangeSpendingLimits={setLimits} />;
  };
  render(<Host />);
  return { getLimits: () => latest };
};

const getMode = () => screen.getByRole('combobox', { name: SystemPropertiesI18nKey.SpendingLimitModeLabel });
const getCostObject = () => screen.getByRole('textbox', { name: SystemPropertiesI18nKey.DefaultCostObjectLabel });

describe('SpendingLimits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAppContext().isReadOnlyAdmin = false;
  });

  afterEach(() => {
    useAppContext().isReadOnlyAdmin = false;
  });

  test('renders the controls with their labels and the override note', () => {
    renderSpendingLimits({ spendingLimits: LIMITS });

    expect(getMode()).toBeTruthy();
    expect(getCostObject()).toBeTruthy();
    expect(screen.getByText(SystemPropertiesI18nKey.SpendingLimitsDescription)).toBeTruthy();
  });

  test('reflects the stored mode and default cost object with the mode hint', () => {
    renderSpendingLimits({ spendingLimits: LIMITS });

    expect(getMode()).toHaveDisplayValue(SystemPropertiesI18nKey.SpendingLimitModeShadow);
    expect(getCostObject()).toHaveValue('TEAM-A');
    expect(screen.getByText(SystemPropertiesI18nKey.SpendingLimitModeShadowHint)).toBeTruthy();
  });

  test('displays Core defaults without materializing them on focus and blur', async () => {
    const user = userEvent.setup();
    const onChangeSpendingLimits = vi.fn();
    renderSpendingLimits({ onChangeSpendingLimits });

    expect(getMode()).toHaveDisplayValue(SystemPropertiesI18nKey.SpendingLimitModeOff);
    expect(getCostObject()).toHaveValue('ORG');
    await user.click(getCostObject());
    await user.tab();

    expect(onChangeSpendingLimits).not.toHaveBeenCalled();
  });

  test('the first mode edit materializes both values', async () => {
    const user = userEvent.setup();
    const { getLimits } = renderWithState();

    await user.click(getMode());
    await user.click(screen.getByRole('option', { name: SystemPropertiesI18nKey.SpendingLimitModeShadow }));

    expect(getLimits()).toEqual({ mode: SpendingLimitMode.Shadow, defaultCostObject: 'ORG' });
  });

  test('editing the cost object keeps the stored mode', async () => {
    const user = userEvent.setup();
    const { getLimits } = renderWithState(LIMITS);

    await user.type(getCostObject(), '2');

    expect(getLimits()).toEqual({ mode: SpendingLimitMode.Shadow, defaultCostObject: 'TEAM-A2' });
  });

  test('shows the enforce warning only for enforce mode', () => {
    const { unmount } = render(
      <SpendingLimits
        spendingLimits={{ ...LIMITS, mode: SpendingLimitMode.Enforce }}
        onChangeSpendingLimits={vi.fn()}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(SystemPropertiesI18nKey.SpendingLimitEnforceWarning);
    unmount();

    renderSpendingLimits({ spendingLimits: LIMITS });
    expect(screen.queryByText(SystemPropertiesI18nKey.SpendingLimitEnforceWarning)).toBeNull();
  });

  test.each([
    ['empty', ''],
    ['whitespace-only', '   '],
  ])('marks a %s cost object invalid', (_name, value) => {
    renderSpendingLimits({ spendingLimits: { ...LIMITS, defaultCostObject: value } });

    expect(screen.getByRole('alert')).toHaveTextContent(SystemPropertiesI18nKey.DefaultCostObjectInvalid);
  });

  test('accepts any non-blank cost object client-side', () => {
    renderSpendingLimits({ spendingLimits: { ...LIMITS, defaultCostObject: 'team/a b' } });

    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('disables both controls for a read-only admin', async () => {
    const user = userEvent.setup();
    const onChangeSpendingLimits = vi.fn();
    useAppContext().isReadOnlyAdmin = true;
    renderSpendingLimits({ spendingLimits: LIMITS, onChangeSpendingLimits });

    expect(getMode()).toBeDisabled();
    expect(getCostObject()).toBeDisabled();
    await user.type(getCostObject(), 'x');

    expect(onChangeSpendingLimits).not.toHaveBeenCalled();
  });
});
