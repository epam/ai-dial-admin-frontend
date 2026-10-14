import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import AssetHeader from '@/src/components/EntityHeaderControls/AssetHeader';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import { StatusBadgeI18nKey } from '@/src/constants/i18n';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialModelResourceStatus } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/components/EntityHeaderControls/Wrappers/SimpleButtonsWrapper', () => ({ default: () => null }));
vi.mock('@/src/components/EntityHeaderControls/Wrappers/AssetButtonsWrapper', () => ({ default: () => null }));
vi.mock('@/src/components/EntityHeaderControls/Tabs/HeaderTabs', () => ({ default: () => null }));
vi.mock('@/src/components/Common/SyncCoreStatus/SyncCoreStatus', () => ({ default: () => null }));

const metadata = (status?: DialModelResourceStatus) => ({ _metadata: { status } });

describe('SimpleEntityHeader — overall status badge', () => {
  const renderHeader = (entity: Record<string, unknown>) =>
    render(
      <SimpleEntityHeader
        view={ApplicationRoute.Roles}
        isChanged={false}
        entity={entity}
        onDiscard={vi.fn()}
        onSave={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

  test('renders the valid badge above the id when the entity is valid', () => {
    renderHeader({ id: 'role-1', ...metadata(DialModelResourceStatus.Valid) });

    expect(screen.getByText(StatusBadgeI18nKey.Valid)).toBeTruthy();
    expect(screen.getByText('role-1')).toBeTruthy();
  });

  test('renders the invalid badge when the entity is invalid', () => {
    renderHeader({ id: 'role-1', ...metadata(DialModelResourceStatus.Invalid) });

    expect(screen.getByText(StatusBadgeI18nKey.Invalid)).toBeTruthy();
  });

  test('renders no badge when the entity carries no status', () => {
    renderHeader({ id: 'role-1' });

    expect(screen.queryByText(StatusBadgeI18nKey.Valid)).toBeNull();
    expect(screen.queryByText(StatusBadgeI18nKey.Invalid)).toBeNull();
    expect(screen.getByText('role-1')).toBeTruthy();
  });
});

describe('AssetHeader — overall status badge', () => {
  const renderHeader = (entity: Record<string, unknown>) =>
    render(
      <AssetHeader
        view={ApplicationRoute.AssetsApplications}
        isChanged={false}
        entity={entity as unknown as AssetWithVersion}
        tabs={[]}
        activeTab={'' as never}
        onChangeActiveTab={vi.fn()}
        onDiscard={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

  test('renders the badge when the entity is invalid', () => {
    renderHeader({ name: 'toolset-1', ...metadata(DialModelResourceStatus.Invalid) });

    expect(screen.getByText(StatusBadgeI18nKey.Invalid)).toBeTruthy();
    expect(screen.getByText('toolset-1')).toBeTruthy();
  });

  test('renders no badge for an entity without a status, such as a public toolset', () => {
    renderHeader({ name: 'toolset-1' });

    expect(screen.queryByText(StatusBadgeI18nKey.Valid)).toBeNull();
    expect(screen.queryByText(StatusBadgeI18nKey.Invalid)).toBeNull();
    expect(screen.getByText('toolset-1')).toBeTruthy();
  });
});
