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
    DialNeutralButton: ({ label, disabled }: { label: string; disabled?: boolean }) => (
      <button disabled={disabled}>{label}</button>
    ),
    DialEllipsisTooltip: ({ text }: { text: string }) => <span>{text}</span>,
    DialTooltip: ({ children, tooltip }: { children: ReactNode; tooltip: string }) => (
      <span data-testid="dial-tooltip" data-tooltip={tooltip}>
        {children}
      </span>
    ),
    DialSwitch: () => <div />,
    DialIconButton: () => <div />,
  };
});

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: () => false,
}));

import AuditView from '@/src/components/ActivityAudit/View/AuditView';
import { RollbackI18nKey } from '@/src/constants/i18n';
import { DialActivity } from '@/src/models/activity-audit';
import { ActivityAuditResourceType, ActivityAuditType } from '@/src/types/activity-audit';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { IMAGE_STATUS } from '@/src/types/deployments/images';

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

  test('renders Rollback enabled for a STOPPED container deployment', () => {
    render(
      <AuditView
        activity={buildActivity(ActivityAuditResourceType.ADAPTER_DEPLOYMENT, 'dep-1')}
        activityRevision={null}
        previousRevision={null}
        currentResourceStatus={CONTAINER_STATUS.STOPPED}
      />,
    );
    const button = screen.getByText(RollbackI18nKey.Resource).closest('button');
    expect(button).not.toBeNull();
    expect(button).not.toBeDisabled();
    expect(screen.queryByTestId('dial-tooltip')).toBeNull();
  });

  test('renders Rollback disabled with tooltip for a RUNNING deployment', () => {
    render(
      <AuditView
        activity={buildActivity(ActivityAuditResourceType.APPLICATION_DEPLOYMENT, 'dep-2')}
        activityRevision={null}
        previousRevision={null}
        currentResourceStatus={CONTAINER_STATUS.RUNNING}
      />,
    );
    const button = screen.getByText(RollbackI18nKey.Resource).closest('button');
    expect(button).toBeDisabled();
    const tooltip = screen.getByTestId('dial-tooltip');
    expect(tooltip.getAttribute('data-tooltip')).toBe(RollbackI18nKey.DisabledDeploymentTooltip);
  });

  test('renders Rollback enabled for a BUILD_FAILED image definition', () => {
    render(
      <AuditView
        activity={buildActivity(ActivityAuditResourceType.MCP_IMAGE_DEFINITION, 'img-1')}
        activityRevision={null}
        previousRevision={null}
        currentResourceStatus={IMAGE_STATUS.BUILD_FAILED}
      />,
    );
    expect(screen.getByText(RollbackI18nKey.Resource).closest('button')).not.toBeDisabled();
  });

  test('renders Rollback disabled with image tooltip when image is BUILDING', () => {
    render(
      <AuditView
        activity={buildActivity(ActivityAuditResourceType.ADAPTER_IMAGE_DEFINITION, 'img-2')}
        activityRevision={null}
        previousRevision={null}
        currentResourceStatus={IMAGE_STATUS.BUILDING}
      />,
    );
    expect(screen.getByText(RollbackI18nKey.Resource).closest('button')).toBeDisabled();
    expect(screen.getByTestId('dial-tooltip').getAttribute('data-tooltip')).toBe(
      RollbackI18nKey.DisabledImageDefinitionTooltip,
    );
  });

  test('renders Rollback disabled with image tooltip when image is BUILT', () => {
    render(
      <AuditView
        activity={buildActivity(ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION, 'img-3')}
        activityRevision={null}
        previousRevision={null}
        currentResourceStatus={IMAGE_STATUS.BUILT}
      />,
    );
    expect(screen.getByText(RollbackI18nKey.Resource).closest('button')).toBeDisabled();
  });

  test('renders Rollback enabled for an image-build domain whitelist regardless of any status', () => {
    render(
      <AuditView
        activity={buildActivity(ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST, '')}
        activityRevision={null}
        previousRevision={null}
      />,
    );
    expect(screen.getByText(RollbackI18nKey.Resource).closest('button')).not.toBeDisabled();
  });

  test('renders Rollback enabled when currentResourceStatus is undefined (live-fetch failed)', () => {
    render(
      <AuditView
        activity={buildActivity(ActivityAuditResourceType.NIM_DEPLOYMENT, 'dep-3')}
        activityRevision={null}
        previousRevision={null}
      />,
    );
    expect(screen.getByText(RollbackI18nKey.Resource).closest('button')).not.toBeDisabled();
    expect(screen.queryByTestId('dial-tooltip')).toBeNull();
  });
});
