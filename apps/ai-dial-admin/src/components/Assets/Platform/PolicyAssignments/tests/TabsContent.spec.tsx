import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { PolicySubjectsI18nKey } from '@/src/constants/i18n';
import { PolicySubjectFunction } from '@/src/models/dial/policy';
import { DialPolicyAssignmentResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';

vi.mock('../Properties', () => ({ default: () => <div>assignment-properties</div> }));

const ASSIGNMENT = { name: 'grant-1', policy: 'daily-cap' } as DialPolicyAssignmentResource;

describe('PolicyAssignments TabsContent', () => {
  test('shows the Properties tab only while it is active', () => {
    render(<TabsContent activeTab={EntityViewTab.Properties} selectedAssignment={ASSIGNMENT} onChange={vi.fn()} />);

    expect(screen.getByText('assignment-properties')).toBeTruthy();
    expect(screen.queryByText(PolicySubjectsI18nKey.Pinned)).toBeNull();
  });

  test('writes a new rule into the assignment subject on the Subjects tab', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TabsContent activeTab={EntityViewTab.Subjects} selectedAssignment={ASSIGNMENT} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: PolicySubjectsI18nKey.AddRule }));

    expect(screen.queryByText('assignment-properties')).toBeNull();
    expect(onChange).toHaveBeenCalledWith({
      ...ASSIGNMENT,
      subject: [{ source: '', function: PolicySubjectFunction.EQUAL, targets: [] }],
    });
  });
});
