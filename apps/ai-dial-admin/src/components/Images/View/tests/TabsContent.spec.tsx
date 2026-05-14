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
vi.mock('@/src/components/Deployments/Common/StatusIndicator/StatusIndicator', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('@/src/components/Images/Fields/ImageFields', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('@/src/components/Images/View/Containers/Containers', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('@/src/components/Images/View/FirewallSettings/FirewallSettings', () => ({
  __esModule: true,
  default: () => <div />,
}));
vi.mock('@/src/components/Images/View/InstallationLog/InstallationLog', () => ({
  __esModule: true,
  default: () => <div />,
}));

import TabsContent from '../TabsContent';
import type { Image } from '@/src/models/deployments/images';
import { ActivityAuditView } from '@/src/types/activity-audit';
import { IMAGE_STATUS, IMAGE_TYPE } from '@/src/types/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';

const image: Image = {
  name: 'mcp-image',
  id: 'img-1',
  $type: IMAGE_TYPE.MCP,
  buildStatus: IMAGE_STATUS.BUILT,
  version: '1.0.0',
  source: { $type: 'docker' } as never,
};

describe('Images/View TabsContent — Audit branch', () => {
  test('renders EntityAudit when activeTab === Audit, passing the image and Deployments viewMode', () => {
    entityAuditSpy.mockClear();
    render(
      <TabsContent
        activeTab={EntityViewTab.Audit}
        selectedImage={image}
        imageVersions={[]}
        onChange={() => {}}
        onChangeVersions={() => {}}
      />,
    );

    expect(screen.getByTestId('entity-audit')).toBeInTheDocument();
    expect(entityAuditSpy).toHaveBeenCalled();
    const props = entityAuditSpy.mock.calls[0][0];
    expect(props.entity).toBe(image);
    expect(props.view).toBe(ApplicationRoute.Images);
    expect(props.viewMode).toBe(ActivityAuditView.Deployments);
  });

  test('does not render EntityAudit on other tabs', () => {
    entityAuditSpy.mockClear();
    render(
      <TabsContent
        activeTab={EntityViewTab.Properties}
        selectedImage={image}
        imageVersions={[]}
        onChange={() => {}}
        onChangeVersions={() => {}}
      />,
    );

    expect(screen.queryByTestId('entity-audit')).not.toBeInTheDocument();
  });
});
