import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { RolesI18nKey } from '@/src/constants/i18n';
import { DialRoleResource } from '@/src/models/dial/resource';
import RoleCostLimit from '../CostLimits';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@epam/ai-dial-ui-kit')>()),
  DialSwitch: ({ label, isOn, onChange, disabled, switchId }: any) => (
    <label>
      <span>{label}</span>
      <input
        type="checkbox"
        role="switch"
        aria-label={label}
        id={switchId}
        checked={!!isOn}
        disabled={disabled}
        onChange={() => onChange(!isOn)}
      />
    </label>
  ),
  DialNumberInput: ({ id, labelProps, value, disabled, onChange }: any) => (
    <label>
      {labelProps?.label !== undefined && <span>{labelProps.label}</span>}
      <input
        id={id}
        aria-label={labelProps?.label}
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value === '' ? undefined : Number(event.target.value))}
      />
    </label>
  ),
}));

const role = (overrides: Partial<DialRoleResource> = {}): DialRoleResource =>
  ({ name: 'my-role', path: 'my-role', folderId: '', ...overrides }) as DialRoleResource;

describe('RoleCostLimit', () => {
  test('reads the toggle as off when costLimit has no tokens at all', () => {
    render(<RoleCostLimit selectedRole={role({ costLimit: {} })} onChangeRole={vi.fn()} />);

    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  test('reads the toggle as on when any token is present', () => {
    render(<RoleCostLimit selectedRole={role({ costLimit: { minute: 100 } })} onChangeRole={vi.fn()} />);

    expect(screen.getByRole('switch')).toBeChecked();
  });

  test('turning the toggle off clears every token by sending an empty costLimit, not the unlimited sentinel', async () => {
    const user = userEvent.setup();
    const onChangeRole = vi.fn();
    render(
      <RoleCostLimit
        selectedRole={role({ costLimit: { minute: 100, day: 100, week: 100, month: 100 } })}
        onChangeRole={onChangeRole}
      />,
    );

    await user.click(screen.getByRole('switch'));

    expect(onChangeRole).toHaveBeenCalledWith(expect.objectContaining({ costLimit: {} }));
  });

  test('entering a value into a token field writes a number, not a string', () => {
    const onChangeRole = vi.fn();
    render(<RoleCostLimit selectedRole={role({ costLimit: { minute: 100 } })} onChangeRole={onChangeRole} />);

    const dayField = screen.getByRole('textbox', { name: RolesI18nKey.PerDay });
    fireEvent.change(dayField, { target: { value: '250' } });

    const lastCall = onChangeRole.mock.calls.at(-1)?.[0];
    expect(lastCall.costLimit.day).toBe(250);
    expect(typeof lastCall.costLimit.day).toBe('number');
  });

  test('clearing a token field removes the key entirely rather than writing an empty string', () => {
    const onChangeRole = vi.fn();
    render(<RoleCostLimit selectedRole={role({ costLimit: { minute: 100, day: 250 } })} onChangeRole={onChangeRole} />);

    const dayField = screen.getByRole('textbox', { name: RolesI18nKey.PerDay });
    fireEvent.change(dayField, { target: { value: '' } });

    const lastCall = onChangeRole.mock.calls.at(-1)?.[0];
    expect(lastCall.costLimit).not.toHaveProperty('day');
    expect(lastCall.costLimit.minute).toBe(100);
  });
});
