import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import AssetButtonsWrapper from '@/src/components/EntityHeaderControls/Wrappers/AssetButtonsWrapper';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({ useIsReadOnlyAdmin: vi.fn(() => false) }));
vi.mock('@/src/hooks/use-is-mobile-screen', () => ({ useIsMobileScreen: () => false }));
vi.mock('@/src/hooks/use-is-tablet-screen', () => ({ useIsOnlyTabletScreen: () => false }));

const baseProps = {
  view: ApplicationRoute.AssetsApplications,
  entity: { name: 'an-app' } as AssetWithVersion,
  isChanged: false,
  onDiscard: vi.fn(),
  onSave: vi.fn(),
  onRemove: vi.fn(),
};

const renderWrapper = (props?: Partial<typeof baseProps>) =>
  render(
    <AssetButtonsWrapper {...baseProps} {...props}>
      <a href="https://example.com">extra-link</a>
    </AssetButtonsWrapper>,
  );

describe('AssetButtonsWrapper :: children', () => {
  test('renders children beside Delete in the normal state', () => {
    renderWrapper();

    expect(screen.getByRole('link', { name: 'extra-link' })).toBeInTheDocument();
  });

  test('drops the children once the entity has unsaved changes', () => {
    renderWrapper({ isChanged: true });

    expect(screen.queryByRole('link', { name: 'extra-link' })).toBeNull();
  });
});
