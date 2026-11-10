import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { DialRouterResource } from '@/src/models/dial/resource';
import { RouterMode } from '@/src/models/dial/router';
import RouterAssetProperties from '../Properties';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

vi.mock('@epam/ai-dial-ui-kit', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@epam/ai-dial-ui-kit');
  return {
    ...actual,
    Select: ({ id, options, onChange, value, labelProps: { label } = {} }: any) => (
      <select aria-label={label ?? id} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {options?.map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    ),
  };
});

const baseAsset = { name: 'cost-aware' } as DialRouterResource;

const renderProperties = (asset: Partial<DialRouterResource> = {}, onChange = vi.fn()) =>
  render(<RouterAssetProperties asset={{ ...baseAsset, ...asset }} onChange={onChange} />);

describe('Router asset Properties', () => {
  test('shows the mode as proxy when the stored router has no mode', () => {
    renderProperties();

    expect(screen.getByRole('combobox', { name: EntityFieldsI18nKey.routerMode })).toHaveValue(RouterMode.Proxy);
  });

  test('renders no decision settings in proxy mode', () => {
    renderProperties();

    expect(screen.queryByRole('spinbutton', { name: EntityFieldsI18nKey.routerDecisionTimeoutMs })).toBeNull();
  });

  test('renders the decision settings in decision mode', () => {
    renderProperties({ mode: RouterMode.Decision, decision: { timeoutMs: 2000, maxDecisions: 4 } });

    expect(screen.getByRole('spinbutton', { name: EntityFieldsI18nKey.routerDecisionTimeoutMs })).toHaveValue(2000);
    expect(screen.getByRole('spinbutton', { name: EntityFieldsI18nKey.routerDecisionMaxDecisions })).toHaveValue(4);
  });

  test('selecting decision writes the mode without seeding any decision defaults', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderProperties({}, onChange);

    await user.selectOptions(
      screen.getByRole('combobox', { name: EntityFieldsI18nKey.routerMode }),
      RouterMode.Decision,
    );

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ mode: RouterMode.Decision }));
    expect(onChange.mock.calls[0][0].decision).toBeUndefined();
  });

  test('selecting proxy removes the mode and the decision object', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderProperties({ mode: RouterMode.Decision, decision: { body: true } }, onChange);

    await user.selectOptions(screen.getByRole('combobox', { name: EntityFieldsI18nKey.routerMode }), RouterMode.Proxy);

    const saved = onChange.mock.calls[0][0] as DialRouterResource;
    expect(saved.mode).toBeUndefined();
    expect(saved.decision).toBeUndefined();
  });

  test('renders no field of another deployment kind', () => {
    renderProperties();

    expect(screen.queryByText(EntityFieldsI18nKey.responsesEndpoint)).toBeNull();
    expect(screen.queryByText(EntityFieldsI18nKey.endpoint)).toBeNull();
  });

  test('renders the router base URL', () => {
    renderProperties({ baseUrl: 'http://localhost:4848' });

    expect(screen.getByDisplayValue('http://localhost:4848')).toBeInTheDocument();
  });
});
