import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { DialAliasResource } from '@/src/models/dial/alias';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import TabsContent from '../TabsContent';

vi.mock('../Properties', () => ({ default: () => <div>properties-tab</div> }));
vi.mock('../Target', () => ({ default: () => <div>target-tab</div> }));
vi.mock('../InvalidAliasBanner', () => ({
  default: ({ issue }: { issue?: { reason: string } }) => <div>{`banner:${issue?.reason ?? 'none'}`}</div>,
}));
vi.mock('@/src/components/EntityView/Roles/AssetRoles', () => ({
  default: ({ view, asset, roles }: { view: string; asset: { userRoles?: string[] }; roles: { name: string }[] }) => (
    <div>{`roles-tab:${view}:${(asset.userRoles ?? []).join(',')}:${roles.length}`}</div>
  ),
}));

const alias: DialAliasResource = { name: 'a', userRoles: ['admin'], target: { path: 'models/gpt' } };

const renderTab = (activeTab: EntityViewTab, healthIssue?: { id: string; reason: string }) =>
  render(
    <TabsContent
      activeTab={activeTab}
      selectedAlias={alias}
      roles={[{ name: 'admin' }]}
      healthIssue={healthIssue}
      onChange={vi.fn()}
    />,
  );

describe('Alias TabsContent', () => {
  test('shows only the properties on the Properties tab', () => {
    renderTab(EntityViewTab.Properties);

    expect(screen.getByText('properties-tab')).toBeTruthy();
    expect(screen.queryByText('target-tab')).toBeNull();
    expect(screen.queryByText(/^roles-tab/)).toBeNull();
  });

  test('shows the target, under the health banner, on the Target tab', () => {
    renderTab(EntityViewTab.Target, { id: 'aliases/a', reason: 'alias_target_missing' });

    expect(screen.getByText('target-tab')).toBeTruthy();
    expect(screen.getByText('banner:alias_target_missing')).toBeTruthy();
  });

  test('shows the roles of the alias, as a model does, on the Roles tab', () => {
    renderTab(EntityViewTab.Roles);

    expect(screen.getByText(`roles-tab:${ApplicationRoute.AssetsAliases}:admin:1`)).toBeTruthy();
  });
});
