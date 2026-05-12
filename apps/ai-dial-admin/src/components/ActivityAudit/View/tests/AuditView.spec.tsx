import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('@/src/components/ActivityAudit/View/DiffReport/CompareControl', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('@/src/components/ActivityAudit/View/DiffReport/EntityDiff', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('@/src/components/ActivityAudit/View/DiffReport/FilterControl', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('@/src/components/ActivityAudit/View/Header/Header', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('@/src/components/Common/CopyButton/CopyButton', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('@/src/components/Common/JsonView/JsonView', () => ({
  __esModule: true,
  default: () => <div />,
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    DialConfirmationPopup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DialNeutralButton: ({ label }: { label: string }) => <button>{label}</button>,
    DialEllipsisTooltip: ({ text }: { text: string }) => <span>{text}</span>,
    DialSwitch: () => <div />,
    DialIconButton: () => <div />,
  };
});

import AuditView from '@/src/components/ActivityAudit/View/AuditView';
import { RollbackI18nKey } from '@/src/constants/i18n';
import { DialActivity } from '@/src/models/activity-audit';
import { ActivityAuditResourceType, ActivityAuditType } from '@/src/types/activity-audit';

const buildActivity = (resourceType: ActivityAuditResourceType, resourceId = 'res-id'): DialActivity => ({
  activityType: ActivityAuditType.Update,
  resourceType,
  resourceId,
  epochTimestampMs: 1_776_000_000_000,
  initiatedAuthor: 'john.doe',
  initiatedEmail: 'john.doe@example.com',
  activityId: '019606d8-a1b2-7000-8000-abcdef123456',
  revision: 42,
});

describe('AuditView :: Resource Rollback visibility', () => {
  test('renders Resource Rollback for admin-backend activities', () => {
    render(
      <AuditView
        activity={buildActivity(ActivityAuditResourceType.MODEL)}
        activityRevision={null}
        previousRevision={null}
      />,
    );
    expect(screen.getByText(RollbackI18nKey.Resource)).toBeInTheDocument();
  });

  test.each([
    ActivityAuditResourceType.ADAPTER_IMAGE_DEFINITION,
    ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION,
    ActivityAuditResourceType.INTERCEPTOR_IMAGE_DEFINITION,
    ActivityAuditResourceType.MCP_IMAGE_DEFINITION,
    ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
  ])('hides Resource Rollback for deployment-manager resource type %s', (resourceType) => {
    render(
      <AuditView
        activity={buildActivity(
          resourceType,
          resourceType === ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST ? '' : 'res-id',
        )}
        activityRevision={null}
        previousRevision={null}
      />,
    );
    expect(screen.queryByText(RollbackI18nKey.Resource)).not.toBeInTheDocument();
  });
});
