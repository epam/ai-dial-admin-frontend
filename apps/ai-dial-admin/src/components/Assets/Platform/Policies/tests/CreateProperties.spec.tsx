import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { NEW_POLICY_DEFAULTS } from '@/src/components/Assets/Platform/Policies/constants';
import Properties from '@/src/components/EntityMainProperties/Properties/Properties';
import { PoliciesI18nKey } from '@/src/constants/i18n';
import { DialPolicyResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';

const VALID = { name: 'cap', ...NEW_POLICY_DEFAULTS, priority: 10, cost: { day: 5 }, folderId: 'platform/' };

const renderCreateForm = (onChangeEntity = vi.fn(), entity: Record<string, unknown> = VALID) => {
  render(
    <Properties
      view={ApplicationRoute.PlatformPolicies}
      entity={entity as unknown as DialPolicyResource}
      names={[]}
      isModal
      onChangeEntity={onChangeEntity}
    />,
  );
  return onChangeEntity;
};

/**
 * The create modal reaches this form through the shared `Properties` dispatcher. Core requires a priority,
 * an object and a cost window on every write, so a name-only form would always be refused with a 422.
 */
describe('Policy asset :: create form', () => {
  test('writes the typed name', () => {
    const onChangeEntity = renderCreateForm(vi.fn(), { ...VALID, name: '' });

    fireEvent.change(screen.getByRole('textbox', { name: /id/i }), { target: { value: 'daily-cap' } });

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ name: 'daily-cap' }));
  });

  test('stores a cost object as its folder', () => {
    const onChangeEntity = renderCreateForm();

    fireEvent.change(screen.getByRole('textbox', { name: new RegExp(PoliciesI18nKey.CostObject) }), {
      target: { value: 'team-a' },
    });

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ folderId: 'team-a/' }));
  });

  test('stores a cleared cost object as the platform root, which makes a global policy', () => {
    const onChangeEntity = renderCreateForm(vi.fn(), { ...VALID, folderId: 'team-a/' });

    fireEvent.change(screen.getByRole('textbox', { name: new RegExp(PoliciesI18nKey.CostObject) }), {
      target: { value: '' },
    });

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ folderId: 'platform/' }));
  });

  test('pre-fills the cost object from the folder the list is showing', () => {
    renderCreateForm(vi.fn(), { ...VALID, folderId: 'platform/team-a/' });

    expect(
      (screen.getByRole('textbox', { name: new RegExp(PoliciesI18nKey.CostObject) }) as HTMLInputElement).value,
    ).toBe('team-a');
  });

  test('shows no error for a valid budget', () => {
    renderCreateForm();

    expect(screen.queryByText(PoliciesI18nKey.PriorityInvalid)).toBeNull();
    expect(screen.queryByText(PoliciesI18nKey.CostWindowRequired)).toBeNull();
  });

  test('flags a missing priority', () => {
    renderCreateForm(vi.fn(), { ...VALID, priority: undefined });

    expect(screen.getByText(PoliciesI18nKey.PriorityInvalid)).toBeTruthy();
  });

  test('flags a cost with no window set', () => {
    renderCreateForm(vi.fn(), { ...VALID, cost: {} });

    expect(screen.getByRole('alert').textContent).toBe(PoliciesI18nKey.CostWindowRequired);
  });

  test('flags a non-positive amount', () => {
    renderCreateForm(vi.fn(), { ...VALID, cost: { day: 0 } });

    expect(screen.getByText(PoliciesI18nKey.AmountInvalid)).toBeTruthy();
  });

  test('switches to a deployment list that must not be empty', () => {
    renderCreateForm(vi.fn(), { ...VALID, object: [] });

    expect(screen.getByText(PoliciesI18nKey.ObjectListRequired)).toBeTruthy();
  });

  test('offers only the one kind and quantity Core accepts', () => {
    renderCreateForm();

    expect(screen.getByText(PoliciesI18nKey.Kind)).toBeTruthy();
    expect(screen.getByText(PoliciesI18nKey.Quantity)).toBeTruthy();
  });
});
