import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import EntityProperties from '../EntityProperties';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/app/[lang]/interceptor-templates/actions', () => ({
  getInterceptorTemplatesList: vi.fn(),
}));

vi.mock('@/src/app/actions/deployments', () => ({
  getInterceptorContainers: vi.fn(),
}));

describe('EntityProperties', () => {
  test('shows an intro field for Interceptors', () => {
    render(
      <EntityProperties
        view={ApplicationRoute.Interceptors}
        entity={{ name: 'my-interceptor', displayName: '', description: '' }}
        names={[]}
        onChangeEntity={vi.fn()}
      />,
    );

    expect(screen.getByText(EntityFieldsI18nKey.intro)).toBeInTheDocument();
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
});
