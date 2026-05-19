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
    render(<ViewHeader activity={baseActivity} />);

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
  });

  test('calls openResourceInNewTab when resource external link is clicked', () => {
    global.open = vi.fn();
    render(<ViewHeader activity={baseActivity} />);
    const buttons = screen.getAllByRole('button');
    // The first button is for resource external link
    fireEvent.click(buttons[0]);
    expect(global.open).toHaveBeenCalledWith('/en/models/123', '_blank');
  });

  test('renders children', () => {
    render(
      <ViewHeader activity={baseActivity}>
        <div>child-content</div>
      </ViewHeader>,
    );
    expect(screen.getByText('child-content')).toBeInTheDocument();
  });

  test('omits the Resource identifier chip when resourceId is empty (firewall singleton)', () => {
    const firewallActivity: DialActivity = {
      ...baseActivity,
      resourceType: ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
      resourceId: '',
    };
    render(<ViewHeader activity={firewallActivity} />);

    expect(screen.queryByText(ActivityAuditI18nKey.ResourceId)).not.toBeInTheDocument();
    expect(screen.getByText(ActivityAuditI18nKey.ActivityType)).toBeInTheDocument();
    expect(screen.getByText(ActivityAuditI18nKey.ResourceType)).toBeInTheDocument();
  });

  test('omits the Resource identifier row for global firewall even when resourceId is present', () => {
    const firewallActivity: DialActivity = {
      ...baseActivity,
      resourceType: ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
      resourceId: 'firewall-id-1',
    };
    render(<ViewHeader activity={firewallActivity} />);

    expect(screen.queryByText(ActivityAuditI18nKey.ResourceId)).not.toBeInTheDocument();
    expect(screen.queryByText('firewall-id-1')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  test('renders the Resource identifier row with icon for a container activity', () => {
    const containerActivity: DialActivity = {
      ...baseActivity,
      resourceType: ActivityAuditResourceType.MCP_DEPLOYMENT,
      resourceId: 'mcp-deploy-1',
    };
    render(<ViewHeader activity={containerActivity} />);

    expect(screen.getByText(ActivityAuditI18nKey.ResourceId)).toBeInTheDocument();
    expect(screen.getByText('mcp-deploy-1')).toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });
});
