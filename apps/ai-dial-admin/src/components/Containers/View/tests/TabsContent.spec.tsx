import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

const entityAuditSpy = vi.fn();

vi.mock('@/src/components/EntityTabs/Audit/EntityAudit', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    entityAuditSpy(props);
    return <div data-testid="entity-audit" />;
  },
}));

vi.mock('@/src/components/EntityTabs/PropertiesTabContent', () => ({
  __esModule: true,
  default: () => <div />,
}));

vi.mock('@/src/components/Containers/View/Events/Events', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('@/src/components/Containers/View/ExecutionLog/ExecutionLog', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('@/src/components/Containers/View/FirewallSettings/FirewallSettings', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('@/src/components/Containers/View/Metrics/Metrics', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('@/src/components/Containers/View/Prompts/Prompts', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('@/src/components/Containers/View/Properties/Properties', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('@/src/components/Containers/View/Resources/Resources', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('@/src/components/Deployments/Common/ImageStatusBanner/ImageStatusBanner', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('@/src/components/Deployments/Common/StatusIndicator/StatusIndicator', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('@/src/components/Tools/Tools', () => ({
  __esModule: true,
  default: () => <div />,
}));

import TabsContent from '../TabsContent';
import { ActivityAuditView } from '@/src/types/activity-audit';
import { CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import type { Container } from '@/src/models/deployments/containers';

const container: Container = {
  name: 'gpt-4-turbo',
  $type: CONTAINER_TYPE.NIM,
  source: { $type: 'image' } as never,
  status: CONTAINER_STATUS.RUNNING,
  metadata: {},
};

describe('Containers/View TabsContent — Audit branch', () => {
  test('renders EntityAudit when activeTab === Audit, passing the container and Deployments viewMode', () => {
    entityAuditSpy.mockClear();
    render(
      <TabsContent
        activeTab={EntityViewTab.Audit}
        selectedContainer={container}
        pods={[]}
        events={[]}
        route={ApplicationRoute.ModelServings}
        names={[]}
        restarts={0}
        onChange={() => {}}
      />,
    );

    expect(screen.getByTestId('entity-audit')).toBeInTheDocument();
    expect(entityAuditSpy).toHaveBeenCalled();
    const props = entityAuditSpy.mock.calls[0][0];
    expect(props.entity).toBe(container);
    expect(props.view).toBe(ApplicationRoute.ModelServings);
    expect(props.viewMode).toBe(ActivityAuditView.Deployments);
  });

  test('does not render EntityAudit on other tabs', () => {
    entityAuditSpy.mockClear();
    render(
      <TabsContent
        activeTab={EntityViewTab.Properties}
        selectedContainer={container}
        pods={[]}
        events={[]}
        route={ApplicationRoute.ModelServings}
        names={[]}
        restarts={0}
        onChange={() => {}}
      />,
    );

    expect(screen.queryByTestId('entity-audit')).not.toBeInTheDocument();
  });
});
