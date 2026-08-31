import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import EntityProperties from '../EntityProperties';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { DialModelResource } from '@/src/models/dial/resource';

vi.mock('@/src/app/[lang]/interceptor-templates/actions', () => ({
  getInterceptorTemplatesList: vi.fn(),
}));

vi.mock('@/src/app/actions/deployments', () => ({
  getInterceptorContainers: vi.fn(),
}));

describe('EntityProperties', () => {
  test('does not show an intro field for Interceptors', () => {
    render(
      <EntityProperties
        view={ApplicationRoute.Interceptors}
        entity={{ name: 'my-interceptor', displayName: '', description: '' }}
        names={[]}
        onChangeEntity={vi.fn()}
        isEntityImmutable
      />,
    );

    expect(screen.queryByText(EntityFieldsI18nKey.intro)).not.toBeInTheDocument();
  });

  test('does not show an intro field for Routes', () => {
    render(
      <EntityProperties
        view={ApplicationRoute.Routes}
        entity={{ name: 'my-route', displayName: '', description: '' }}
        names={[]}
        onChangeEntity={vi.fn()}
      />,
    );

    expect(screen.queryByText(EntityFieldsI18nKey.intro)).not.toBeInTheDocument();
  });

  test('shows an optional display version field for the model asset view', () => {
    const onChangeEntity = vi.fn();
    render(
      <EntityProperties
        view={ApplicationRoute.PlatformModels}
        entity={{ name: 'my-model', displayName: '', description: '', displayVersion: '1.0.0' } as DialModelResource}
        names={[]}
        onChangeEntity={onChangeEntity}
      />,
    );

    expect(screen.getByText(EntityFieldsI18nKey.displayVersion)).toBeInTheDocument();
    const input = screen.getByDisplayValue('1.0.0');

    fireEvent.change(input, { target: { value: '2.0' } });
    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ displayVersion: '2.0' }));
  });

  test('does not show a display version field for Routes', () => {
    render(
      <EntityProperties
        view={ApplicationRoute.Routes}
        entity={{ name: 'my-route', displayName: '', description: '' }}
        names={[]}
        onChangeEntity={vi.fn()}
      />,
    );

    expect(screen.queryByText(EntityFieldsI18nKey.displayVersion)).not.toBeInTheDocument();
  });
});
