import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getPolicies } from '@/src/app/[lang]/platform-policies/actions';
import { PolicyAssignmentsI18nKey } from '@/src/constants/i18n';
import { DialPolicyAssignmentResource } from '@/src/models/dial/resource';
import PolicyAssignmentAssetProperties from '../Properties';

vi.mock('@/src/app/[lang]/platform-policies/actions', () => ({ getPolicies: vi.fn() }));

const ASSIGNMENT = {
  name: 'grant-1',
  policy: 'daily-cap',
  ticket: 'T-1',
  _metadata: { name: 'grant-1', path: 'team-a/grant-1', folderId: 'team-a/' },
} as DialPolicyAssignmentResource;

const renderProperties = (asset: DialPolicyAssignmentResource = ASSIGNMENT, onChange = vi.fn()) => {
  render(<PolicyAssignmentAssetProperties asset={asset} onChange={onChange} />);
  return onChange;
};

const field = (key: string) => screen.getByRole('textbox', { name: new RegExp(key) }) as HTMLInputElement;

describe('PolicyAssignmentAssetProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPolicies).mockResolvedValue([]);
  });

  test('shows the cost object from the folder, which cannot be edited', () => {
    renderProperties();

    expect(field(PolicyAssignmentsI18nKey.CostObject).value).toBe('team-a');
    expect(field(PolicyAssignmentsI18nKey.CostObject).disabled).toBe(true);
  });

  test('writes an edited ticket into the assignment', () => {
    const onChange = renderProperties();

    fireEvent.change(field(PolicyAssignmentsI18nKey.Ticket), { target: { value: 'T-2' } });

    expect(onChange).toHaveBeenCalledWith({ ...ASSIGNMENT, ticket: 'T-2' });
  });

  test('flags an expiry with no offset', () => {
    renderProperties({ ...ASSIGNMENT, expiresAt: '2027-01-01T00:00:00' });

    expect(screen.getByText(PolicyAssignmentsI18nKey.ExpiresAtInvalid)).toBeTruthy();
  });

  test('accepts an expiry with an offset', () => {
    renderProperties({ ...ASSIGNMENT, expiresAt: '2027-01-01T00:00:00Z' });

    expect(screen.queryByText(PolicyAssignmentsI18nKey.ExpiresAtInvalid)).toBeNull();
  });

  test('says a policy is required when none is set', () => {
    renderProperties({ ...ASSIGNMENT, policy: undefined });

    expect(screen.getByText(PolicyAssignmentsI18nKey.PolicyRequired)).toBeTruthy();
  });

  test('reads the policies for the assignment’s own cost object', async () => {
    renderProperties();

    await vi.waitFor(() => expect(getPolicies).toHaveBeenCalledWith('team-a/'));
  });
});
