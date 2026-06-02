import { render, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

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

const getDeploymentEntityStateMock = vi.fn();
vi.mock('@/src/app/actions/deployments', () => ({
  getDeploymentEntityState: (...args: unknown[]) => getDeploymentEntityStateMock(...args),
}));
vi.mock('@/src/utils/audit/get-deployment-rollback-request', () => ({
  rollbackDeploymentEntity: vi.fn(() => Promise.resolve({ success: true })),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    DialConfirmationPopup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    DialNeutralButton: ({
      label,
      disabled,
      tooltipProps,
    }: {
      label: string;
      disabled?: boolean;
      tooltipProps?: { tooltip?: string };
    }) => (
      <button disabled={disabled} title={tooltipProps?.tooltip}>
        {label}
      </button>
    ),
    DialEllipsisTooltip: ({ text }: { text: string }) => <span>{text}</span>,
    DialSwitch: () => <div />,
    DialIconButton: () => <div />,
  };
});

import AuditView from '@/src/components/ActivityAudit/View/AuditView';
import { RollbackI18nKey } from '@/src/constants/i18n';
import { DialActivity } from '@/src/models/activity-audit';
import { ActivityAuditResourceType, ActivityAuditType } from '@/src/types/activity-audit';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { IMAGE_STATUS } from '@/src/types/deployments/images';

const buildActivity = (
  resourceType: ActivityAuditResourceType,
  resourceId = 'res-id',
  activityType = ActivityAuditType.Update,
): DialActivity => ({
  activityType,
  resourceType,
  resourceId,
  epochTimestampMs: 1_776_000_000_000,
  initiatedAuthor: 'john.doe',
  initiatedEmail: 'john.doe@example.com',
  activityId: '019606d8-a1b2-7000-8000-abcdef123456',
  revision: 42,
});

const rollbackButton = () => screen.getByText(RollbackI18nKey.Resource).closest('button');

describe('AuditView :: Resource Rollback', () => {
  beforeEach(() => {
    getDeploymentEntityStateMock.mockReset();
    getDeploymentEntityStateMock.mockResolvedValue(null);
  });

  test('renders Resource Rollback for admin-backend activities', () => {
    getDeploymentEntityStateMock.mockResolvedValue(null);
    render(
      <AuditView
        activity={buildActivity(ActivityAuditResourceType.MODEL)}
        activityRevision={null}
        previousRevision={null}
      />,
    );
    expect(rollbackButton()).toBeEnabled();
  });

  test('renders Resource Rollback for image-definition activities (no longer hidden)', () => {
    getDeploymentEntityStateMock.mockResolvedValue({ buildStatus: IMAGE_STATUS.NOT_BUILT });
    render(
      <AuditView
        activity={buildActivity(ActivityAuditResourceType.MCP_IMAGE_DEFINITION)}
        activityRevision={null}
        previousRevision={null}
      />,
    );
    expect(screen.getByText(RollbackI18nKey.Resource)).toBeInTheDocument();
  });

  test('disables rollback while the image is building', async () => {
    getDeploymentEntityStateMock.mockResolvedValue({ buildStatus: IMAGE_STATUS.BUILDING });
    render(
      <AuditView
        activity={buildActivity(ActivityAuditResourceType.MCP_IMAGE_DEFINITION)}
        activityRevision={null}
        previousRevision={null}
      />,
    );
    await waitFor(() => expect(rollbackButton()).toBeDisabled());
    expect(rollbackButton()).toHaveAttribute('title', RollbackI18nKey.BlockedImageBuilding);
  });

  test('disables rollback while the container is active', async () => {
    getDeploymentEntityStateMock.mockResolvedValue({ status: CONTAINER_STATUS.RUNNING });
    render(
      <AuditView
        activity={buildActivity(ActivityAuditResourceType.MCP_DEPLOYMENT)}
        activityRevision={null}
        previousRevision={null}
      />,
    );
    await waitFor(() => expect(rollbackButton()).toBeDisabled());
  });

  test('enables rollback for an inactive container', async () => {
    getDeploymentEntityStateMock.mockResolvedValue({ status: CONTAINER_STATUS.STOPPED });
    render(
      <AuditView
        activity={buildActivity(ActivityAuditResourceType.MCP_DEPLOYMENT)}
        activityRevision={null}
        previousRevision={null}
      />,
    );
    expect(rollbackButton()).toBeEnabled();
  });

  test('renders rollback for the whitelist without a lifecycle check', () => {
    render(
      <AuditView
        activity={buildActivity(ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST, '')}
        activityRevision={null}
        previousRevision={null}
      />,
    );
    expect(rollbackButton()).toBeEnabled();
    expect(getDeploymentEntityStateMock).not.toHaveBeenCalled();
  });
});
