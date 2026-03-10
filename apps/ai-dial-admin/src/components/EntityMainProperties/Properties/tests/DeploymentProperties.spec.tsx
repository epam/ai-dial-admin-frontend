import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import DeploymentProperties from '../DeploymentProperties';
import { ApplicationRoute } from '@/src/types/routes';
import { ErrorI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/app/[lang]/models/actions', () => ({
  getModelsAdapters: vi.fn(),
}));

vi.mock('@/src/app/actions/deployments', () => ({
  getMCPContainers: vi.fn(),
  getModelContainers: vi.fn(),
}));

describe('DeploymentProperties', () => {
  test('shows duplicate ID error when entity name matches an existing name', () => {
    render(
      <DeploymentProperties
        view={ApplicationRoute.Models}
        entity={{ name: 'existing-model', displayName: '', description: '' }}
        names={['existing-model']}
        onChangeEntity={vi.fn()}
      />,
    );

    expect(screen.getByText(ErrorI18nKey.NameExists)).toBeInTheDocument();
  });

  test('does not show duplicate ID error when entity name is unique', () => {
    render(
      <DeploymentProperties
        view={ApplicationRoute.Models}
        entity={{ name: 'new-model', displayName: '', description: '' }}
        names={['existing-model']}
        onChangeEntity={vi.fn()}
      />,
    );

    expect(screen.queryByText(ErrorI18nKey.NameExists)).not.toBeInTheDocument();
  });
});
