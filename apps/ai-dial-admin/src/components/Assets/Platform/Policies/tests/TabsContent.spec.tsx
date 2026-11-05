import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { PolicySubjectsI18nKey } from '@/src/constants/i18n';
import { PolicySubjectFunction } from '@/src/models/dial/policy';
import { DialPolicyResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';

vi.mock('../Properties', () => ({ default: () => <div>policy-properties</div> }));

const POLICY = { name: 'cap', priority: 10, object: '*', cost: { day: 5 } } as DialPolicyResource;

describe('Policies TabsContent', () => {
  test('shows the Properties tab only while it is active', () => {
    render(<TabsContent activeTab={EntityViewTab.Properties} selectedPolicy={POLICY} onChange={vi.fn()} />);

    expect(screen.getByText('policy-properties')).toBeTruthy();
    expect(screen.queryByText(PolicySubjectsI18nKey.Pinned)).toBeNull();
  });

  test('shows the subject rule editor on the Subjects tab', () => {
    render(<TabsContent activeTab={EntityViewTab.Subjects} selectedPolicy={POLICY} onChange={vi.fn()} />);

    expect(screen.getByText(PolicySubjectsI18nKey.Pinned)).toBeTruthy();
    expect(screen.queryByText('policy-properties')).toBeNull();
  });

  test('writes a new rule into the policy subject', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TabsContent activeTab={EntityViewTab.Subjects} selectedPolicy={POLICY} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: PolicySubjectsI18nKey.AddRule }));

    expect(onChange).toHaveBeenCalledWith({
      ...POLICY,
      subject: [{ source: '', function: PolicySubjectFunction.EQUAL, targets: [] }],
    });
  });
});
