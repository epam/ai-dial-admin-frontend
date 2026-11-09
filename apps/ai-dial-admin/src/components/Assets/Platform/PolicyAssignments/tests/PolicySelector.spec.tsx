import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getPolicies } from '@/src/app/[lang]/platform-policies/actions';
import PolicySelector from '@/src/components/Assets/Platform/PolicyAssignments/PolicySelector';
import { PolicyAssignmentsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';

vi.mock('@/src/app/[lang]/platform-policies/actions', () => ({ getPolicies: vi.fn() }));

const renderSelector = (props: Partial<React.ComponentProps<typeof PolicySelector>> = {}) =>
  render(<PolicySelector costObject="team-a" onChange={vi.fn()} {...props} />);

describe('PolicySelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPolicies).mockResolvedValue([]);
  });

  test('reads the global policies and the cost object’s own project policies', async () => {
    renderSelector({ costObject: 'team-a' });

    await vi.waitFor(() => expect(getPolicies).toHaveBeenCalledTimes(2));
    expect(getPolicies).toHaveBeenCalledWith('');
    expect(getPolicies).toHaveBeenCalledWith('team-a/');
  });

  test('reads only the global policies while no cost object is set', async () => {
    renderSelector({ costObject: '' });

    await vi.waitFor(() => expect(getPolicies).toHaveBeenCalledOnce());
    expect(getPolicies).toHaveBeenCalledWith('');
  });

  test('never reads another cost object’s project policies', async () => {
    renderSelector({ costObject: 'team-a' });

    await vi.waitFor(() => expect(getPolicies).toHaveBeenCalledTimes(2));
    expect(getPolicies).not.toHaveBeenCalledWith('team-b/');
  });

  test('falls back to a path input and tells the user when the listing fails', async () => {
    vi.mocked(getPolicies).mockRejectedValue(new Error('boom'));
    renderSelector();

    expect(await screen.findByRole('textbox', { name: new RegExp(PolicyAssignmentsI18nKey.PolicyPath) })).toBeTruthy();
    expect(useNotification().showNotification).toHaveBeenCalled();
  });

  test('writes a typed path from the fallback input', async () => {
    vi.mocked(getPolicies).mockRejectedValue(new Error('boom'));
    const onChange = vi.fn();
    renderSelector({ onChange });

    const input = await screen.findByRole('textbox', { name: new RegExp(PolicyAssignmentsI18nKey.PolicyPath) });
    fireEvent.change(input, { target: { value: 'daily-cap' } });

    expect(onChange).toHaveBeenCalledWith('daily-cap');
  });
});
