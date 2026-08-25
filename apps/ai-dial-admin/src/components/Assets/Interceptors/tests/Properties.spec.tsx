import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { DialInterceptorResource } from '@/src/models/dial/resource';
import InterceptorAssetProperties from '../Properties';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

const baseAsset = {
  name: 'redactor',
  path: 'redactor',
  folderId: '',
} as DialInterceptorResource;

const renderProperties = (asset: Partial<DialInterceptorResource> = {}) =>
  render(<InterceptorAssetProperties asset={{ ...baseAsset, ...asset }} onChange={vi.fn()} />);

describe('Interceptor asset Properties', () => {
  test('Should render an endpoint field, so an interceptor is routable without the JSON editor', () => {
    renderProperties();

    expect(screen.getByText(EntityFieldsI18nKey.endpoint)).toBeInTheDocument();
  });

  test('Should render the override name control', () => {
    renderProperties({ overrideName: 'upstream-facing-name' });

    expect(screen.getByDisplayValue('upstream-facing-name')).toBeInTheDocument();
  });

  test('Should render the display name with the given value', () => {
    renderProperties({ displayName: 'Redactor' });

    expect(screen.getByDisplayValue('Redactor')).toBeInTheDocument();
  });

  test('Should render the icon control', () => {
    renderProperties();

    expect(screen.getByText(EntityFieldsI18nKey.iconUrl)).toBeInTheDocument();
  });

  test('Should render the topics control', () => {
    renderProperties();

    expect(screen.getByText(EntityFieldsI18nKey.topics)).toBeInTheDocument();
  });

  test('Should render the forward-auth-token control', () => {
    renderProperties();

    expect(screen.getByText(EntityFieldsI18nKey.forwardAuthToken)).toBeInTheDocument();
  });

  test('Should offer no source selector, since a Core interceptor resource carries no source', () => {
    renderProperties();

    expect(screen.queryByText(EntityFieldsI18nKey.$type)).not.toBeInTheDocument();
  });
});
