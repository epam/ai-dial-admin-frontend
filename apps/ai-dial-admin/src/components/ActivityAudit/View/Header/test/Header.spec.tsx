import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ViewHeader from '../Header';
import { DialActivity } from '@/src/models/activity-audit';
import { ActivityAuditResourceType, ActivityAuditType } from '@/src/types/activity-audit';
import { ActivityAuditI18nKey } from '@/src/constants/i18n';

describe('ViewHeader', () => {
  const baseActivity: DialActivity = {
    activityType: ActivityAuditType.Create,
    resourceType: ActivityAuditResourceType.MODEL,
    resourceId: '123',
    epochTimestampMs: 123456789,
    initiatedEmail: 'user@example.com',
    initiatedAuthor: 'userId',
    activityId: 'act-1',
    revision: 1,
  };

  test('renders all labeled fields', () => {
    render(<ViewHeader activity={baseActivity} isModalView={true} />);

    expect(screen.getByText(ActivityAuditI18nKey.ActivityType)).toBeInTheDocument();
    expect(screen.getByText(ActivityAuditType.Create)).toBeInTheDocument();
    expect(screen.getByText(ActivityAuditI18nKey.ResourceType)).toBeInTheDocument();
    expect(screen.getByText(ActivityAuditResourceType.MODEL)).toBeInTheDocument();
    expect(screen.getByText(ActivityAuditI18nKey.ResourceId)).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.getByText(ActivityAuditI18nKey.Initiated)).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByText(ActivityAuditI18nKey.UserId)).toBeInTheDocument();
    expect(screen.getByText('userId')).toBeInTheDocument();
    expect(screen.getByText(ActivityAuditI18nKey.ActivityId)).toBeInTheDocument();
    expect(screen.getByText('act-1')).toBeInTheDocument();
  });

  test('calls openResourceInNewTab when resource external link is clicked', () => {
    global.open = vi.fn();
    render(<ViewHeader activity={baseActivity} />);
    const buttons = screen.getAllByRole('button');
    // The first button is for resource external link
    fireEvent.click(buttons[0]);
    expect(global.open).toHaveBeenCalledWith('/en/models/123', '_blank');
  });

  test('calls openActivityInNewTab when activity external link is clicked in modal view', () => {
    global.open = vi.fn();
    render(<ViewHeader activity={baseActivity} isModalView={true} />);
    const buttons = screen.getAllByRole('button');
    // The second button is for activity external link
    fireEvent.click(buttons[1]);
    expect(global.open).toHaveBeenCalledWith('/activity-audit/act-1', '_blank');
  });

  test('renders children', () => {
    render(
      <ViewHeader activity={baseActivity}>
        <div>child-content</div>
      </ViewHeader>,
    );
    expect(screen.getByText('child-content')).toBeInTheDocument();
  });
});
