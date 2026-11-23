import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { AssetTabsI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { AssetSource } from '@/src/models/dial/asset-source';
import { ApplicationRoute } from '@/src/types/routes';
import CreateSeededAsset from '../CreateSeededAsset';

vi.mock('../CreateAsset', () => ({
  default: ({ topSlot, initialValues }: { topSlot: React.ReactNode; initialValues?: { name?: string } }) => (
    <div>
      <span>public-form:{initialValues?.name}</span>
      {topSlot}
    </div>
  ),
}));

vi.mock('@/src/components/Assets/Platform/CreatePlatformEntity', () => ({
  default: ({
    topSlot,
    names,
    initialValues,
  }: {
    topSlot: React.ReactNode;
    names: string[];
    initialValues?: { name?: string };
  }) => (
    <div>
      <span>platform-form:{initialValues?.name}</span>
      <span>names:{names.join(',')}</span>
      {topSlot}
    </div>
  ),
}));

const renderSeeded = (defaultDestination?: AssetSource.Public | AssetSource.Platform) =>
  render(
    <CreateSeededAsset
      view={ApplicationRoute.AssetsApplications}
      isOpen
      context={() => ({}) as AssetsFolderContextReader}
      initialValues={{ name: 'seed' }}
      platformNames={['taken']}
      defaultDestination={defaultDestination}
      onClose={vi.fn()}
    />,
  );

describe('CreateSeededAsset', () => {
  test('opens on the Public form by default and passes the seed through', () => {
    renderSeeded();

    expect(screen.getByText('public-form:seed')).toBeInTheDocument();
    expect(screen.queryByText('platform-form:seed')).not.toBeInTheDocument();
  });

  test('opens on the Platform form when that is the default destination', () => {
    renderSeeded(AssetSource.Platform);

    expect(screen.getByText('platform-form:seed')).toBeInTheDocument();
    expect(screen.getByText('names:taken')).toBeInTheDocument();
  });

  test('offers both destinations as tabs', () => {
    renderSeeded();

    expect(screen.getByRole('tablist', { name: AssetTabsI18nKey.Destination })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: AssetTabsI18nKey.Public })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: AssetTabsI18nKey.Platform })).toBeInTheDocument();
  });

  test('switches between the Public and Platform forms through the destination tabs', async () => {
    const user = userEvent.setup();
    renderSeeded();

    await user.click(screen.getByRole('tab', { name: AssetTabsI18nKey.Platform }));
    expect(screen.getByText('platform-form:seed')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: AssetTabsI18nKey.Public }));
    expect(screen.getByText('public-form:seed')).toBeInTheDocument();
  });
});
