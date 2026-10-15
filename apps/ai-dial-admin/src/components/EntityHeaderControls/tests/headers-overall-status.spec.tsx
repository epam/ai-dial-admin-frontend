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
vi.mock('@/src/components/Common/SyncCoreStatus/SyncCoreStatus', () => ({
  default: () => <span>core-sync-badge</span>,
}));
vi.mock('@/src/context/AppContext', () => ({ useAppContext: () => ({ featureFlags: { adminApiEnabled: true } }) }));

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

  test('renders the badge for an application or key from validityState, with its message as the hint', () => {
    renderHeader({ id: 'app-1', validityState: { valid: false, message: 'Missing deployment' } });

    expect(screen.getByText(StatusBadgeI18nKey.Invalid)).toBeTruthy();
    expect(screen.getByRole('button', { name: StatusBadgeI18nKey.Details })).toBeTruthy();
  });

  test('renders the badge for a test suite from its valid flag', () => {
    renderHeader({ id: 'suite-1', name: 'suite-1', valid: true });

    expect(screen.getByText(StatusBadgeI18nKey.Valid)).toBeTruthy();
  });

  test('renders no validity badge when the view opts out, even if the entity carries a valid flag', () => {
    render(
      <SimpleEntityHeader
        view={ApplicationRoute.Datasets}
        isChanged={false}
        entity={{ id: 'ds-1', name: 'ds-1', valid: false }}
        hasValidityBadge={false}
        onDiscard={vi.fn()}
        onSave={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.queryByText(StatusBadgeI18nKey.Valid)).toBeNull();
    expect(screen.queryByText(StatusBadgeI18nKey.Invalid)).toBeNull();
    expect(screen.getByText('ds-1')).toBeTruthy();
  });

  test('renders validity and sync in one row, validity first, and caller badges after them', () => {
    render(
      <SimpleEntityHeader
        view={ApplicationRoute.Roles}
        isChanged={false}
        entity={{ id: 'role-1', ...metadata(DialModelResourceStatus.Valid) }}
        statusBadges={<span>caller-badge</span>}
        onDiscard={vi.fn()}
        onSave={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    const row = screen.getByText(StatusBadgeI18nKey.Valid).closest('.gap-5') as HTMLElement;
    expect(row).toContainElement(screen.getByText('core-sync-badge'));
    expect(row).toContainElement(screen.getByText('caller-badge'));
    const order = Array.from(row.querySelectorAll('span')).map((el) => el.textContent);
    expect(order.indexOf(StatusBadgeI18nKey.Valid)).toBeLessThan(order.indexOf('core-sync-badge'));
    expect(order.indexOf('core-sync-badge')).toBeLessThan(order.indexOf('caller-badge'));
  });

  test('renders only the sync badge when the entity has no validity', () => {
    renderHeader({ id: 'role-1' });

    expect(screen.getByText('core-sync-badge')).toBeTruthy();
    expect(screen.queryByText(StatusBadgeI18nKey.Valid)).toBeNull();
  });

  test('renders no badge when the entity carries no status', () => {
    renderHeader({ id: 'role-1' });

    expect(screen.queryByText(StatusBadgeI18nKey.Valid)).toBeNull();
    expect(screen.queryByText(StatusBadgeI18nKey.Invalid)).toBeNull();
    expect(screen.getByText('role-1')).toBeTruthy();
  });
});

describe('SimpleEntityHeader — no sync support', () => {
  test('renders no badge row content for a view without a sync lookup and no validity', () => {
    const { container } = render(
      <SimpleEntityHeader
        view={ApplicationRoute.Runs}
        isChanged={false}
        entity={{ id: 'run-1' }}
        onDiscard={vi.fn()}
        onSave={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.queryByText('core-sync-badge')).toBeNull();
    expect(container.querySelector('.gap-5')).toBeEmptyDOMElement();
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
