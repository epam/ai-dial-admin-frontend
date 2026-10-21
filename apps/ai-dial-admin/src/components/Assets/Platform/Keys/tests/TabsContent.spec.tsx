import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { DialKeyResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';

vi.mock('../Properties', () => ({
  default: () => <div>KeyAssetProperties</div>,
}));

vi.mock('../KeyRoles', () => ({
  default: () => <div>KeyRoles</div>,
}));

const baseKey: DialKeyResource = {
  name: 'k1',
  path: 'k1',
  folderId: '',
} as unknown as DialKeyResource;

const renderTabsContent = (activeTab: EntityViewTab) =>
  render(
    <TabsContent activeTab={activeTab} selectedKey={baseKey} originalKey={baseKey} roles={[]} onChange={vi.fn()} />,
  );

describe('Key TabsContent', () => {
  test('Renders Properties when the Properties tab is active', () => {
    renderTabsContent(EntityViewTab.Properties);

    expect(screen.getByText('KeyAssetProperties')).toBeInTheDocument();
    expect(screen.queryByText('KeyRoles')).not.toBeInTheDocument();
  });

  test('Renders KeyRoles when the Roles tab is active', () => {
    renderTabsContent(EntityViewTab.Roles);

    expect(screen.getByText('KeyRoles')).toBeInTheDocument();
    expect(screen.queryByText('KeyAssetProperties')).not.toBeInTheDocument();
  });
});
