import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import Properties from '@/src/components/EntityMainProperties/Properties/Properties';
import { EntityFieldsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { DialRouteResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import RouteCreateProperties from '../CreateProperties';

const renderCreateForm = (onChangeEntity: (entity: object) => void, entity = {} as DialRouteResource) =>
  render(
    <Properties
      view={ApplicationRoute.PlatformRoutes}
      entity={entity}
      names={[]}
      isModal
      onChangeEntity={onChangeEntity}
    />,
  );

const renderRouteCreateProperties = (onChangeEntity: (entity: object) => void, entity = {}) =>
  render(<RouteCreateProperties entity={entity} names={[]} onChangeEntity={onChangeEntity} />);

/**
 * The create modal reaches this form through the shared `Properties` dispatcher. Falling through to
 * the generic entity form looks correct on screen but always seeds `displayName`/`description` —
 * neither of which `Route` has — and Core rejects the whole write once either is present.
 */
describe('Route asset :: create form', () => {
  test('writes the name the user types to name', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: /id/i }), { target: { value: 'my-route' } });

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ name: 'my-route' }));
  });

  test('renders no display-name or description control', () => {
    renderCreateForm(vi.fn());

    expect(screen.queryByRole('textbox', { name: /display name/i })).toBeNull();
    expect(screen.queryByRole('textbox', { name: /description/i })).toBeNull();
  });

  test('renders a required path control', () => {
    renderCreateForm(vi.fn());

    expect(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.paths}*` })).toBeInTheDocument();
  });

  test('writes a valid initial path as the sole paths item', () => {
    const onChangeEntity = vi.fn();
    renderRouteCreateProperties(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.paths}*` }), {
      target: { value: '/v1/chat' },
    });

    expect(onChangeEntity).toHaveBeenCalledWith({ paths: ['/v1/chat'] });
  });

  test('shows an invalid-path error for an invalid path', () => {
    renderRouteCreateProperties(vi.fn());

    fireEvent.change(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.paths}*` }), {
      target: { value: 'v1/chat' },
    });

    expect(screen.getByText(ErrorI18nKey.InvalidPath)).toBeInTheDocument();
  });

  test('shows a required-path error after clearing the path', () => {
    renderRouteCreateProperties(vi.fn(), { paths: ['/v1/chat'] });
    const pathInput = screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.paths}*` });

    fireEvent.change(pathInput, { target: { value: '' } });

    expect(screen.getByText(ErrorI18nKey.RequiredProperty)).toBeInTheDocument();
  });
});
