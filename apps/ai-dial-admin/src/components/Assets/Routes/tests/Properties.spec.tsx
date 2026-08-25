import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey, RoutesI18nKey } from '@/src/constants/i18n';
import { DialRouteResource } from '@/src/models/dial/resource';
import RouteAssetProperties from '../Properties';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

const baseAsset = {
  name: 'my-route',
  path: 'my-route',
  folderId: '',
} as DialRouteResource;

const renderProperties = (asset: Partial<DialRouteResource> = {}) =>
  render(<RouteAssetProperties asset={{ ...baseAsset, ...asset }} originalAsset={baseAsset} onChange={vi.fn()} />);

describe('Route asset Properties', () => {
  test('Should render the paths control', () => {
    renderProperties();

    expect(screen.getByText(EntityFieldsI18nKey.paths)).toBeInTheDocument();
  });

  test('Should render the methods control', () => {
    renderProperties();

    expect(screen.getByText(EntityFieldsI18nKey.methods)).toBeInTheDocument();
  });

  test('Should render the rewrite-path switch', () => {
    renderProperties();

    expect(screen.getByText(EntityFieldsI18nKey.rewritePath)).toBeInTheDocument();
  });

  const getStatusBodyContainer = () => screen.getByText(EntityFieldsI18nKey.status).closest('div')?.parentElement;

  test('Should keep the status/body fields hidden when no response output is set', () => {
    renderProperties();

    expect(getStatusBodyContainer()).toHaveClass('hidden');
  });

  test('Should reveal the status and body fields when a response is set', () => {
    renderProperties({ response: { status: 200, body: 'ok' } });

    expect(getStatusBodyContainer()).not.toHaveClass('hidden');
    expect(screen.getByText(EntityFieldsI18nKey.body)).toBeInTheDocument();
  });

  test('Should render the max-retry-attempts control', () => {
    renderProperties();

    expect(screen.getByText(EntityFieldsI18nKey.maxRetryAttempts)).toBeInTheDocument();
  });

  test('Should render the request and response attachment path controls', () => {
    renderProperties();

    expect(screen.getByText(RoutesI18nKey.RequestAttachmentPaths)).toBeInTheDocument();
    expect(screen.getByText(RoutesI18nKey.ResponseAttachmentPaths)).toBeInTheDocument();
  });

  test('Should offer no display name control, since a Core route resource carries none', () => {
    renderProperties();

    expect(screen.queryByText(EntityFieldsI18nKey.displayName)).not.toBeInTheDocument();
  });
});
