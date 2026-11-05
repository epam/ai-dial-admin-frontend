import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { PoliciesI18nKey } from '@/src/constants/i18n';
import { DialPolicyResource } from '@/src/models/dial/resource';
import PolicyAssetProperties from '../Properties';

const POLICY = {
  name: 'team-cap',
  priority: 10,
  object: '*',
  cost: { day: 5, month: 100 },
  _metadata: { name: 'team-cap', path: 'team-a/team-cap', folderId: 'team-a/' },
} as DialPolicyResource;

const renderProperties = (asset: DialPolicyResource = POLICY, onChange = vi.fn()) => {
  render(<PolicyAssetProperties asset={asset} onChange={onChange} />);
  return onChange;
};

describe('PolicyAssetProperties', () => {
  test('shows the budget the policy was loaded with', () => {
    renderProperties();

    expect(
      (screen.getByRole('spinbutton', { name: new RegExp(PoliciesI18nKey.Priority) }) as HTMLInputElement).value,
    ).toBe('10');
    expect(
      (screen.getByRole('spinbutton', { name: new RegExp(PoliciesI18nKey.CostPerDay) }) as HTMLInputElement).value,
    ).toBe('5');
  });

  test('writes an edited cost object into costObject', () => {
    const onChange = renderProperties();

    fireEvent.change(screen.getByRole('textbox', { name: new RegExp(PoliciesI18nKey.CostObject) }), {
      target: { value: 'team-a' },
    });

    expect(onChange).toHaveBeenCalledWith({ ...POLICY, costObject: 'team-a' });
  });

  test('flags a policy edited into an invalid budget', () => {
    renderProperties({ ...POLICY, cost: {} });

    expect(screen.getByRole('alert').textContent).toBe(PoliciesI18nKey.CostWindowRequired);
  });
});
