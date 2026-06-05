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
  test('does not show duplicate ID error when names list uses display names not deployment ids', () => {
    render(
      <DeploymentProperties
        view={ApplicationRoute.Models}
        entity={{ name: 'my-deployment-id', displayName: '', description: '' }}
        names={['Other Model___1.0.0']}
        onChangeEntity={vi.fn()}
      />,
    );

    expect(screen.queryByText(ErrorI18nKey.NameExists)).not.toBeInTheDocument();
  });

  test('shows duplicate ID error when backend reports non-unique name', () => {
    render(
      <DeploymentProperties
        view={ApplicationRoute.Models}
        entity={{ name: 'existing-model', displayName: '', description: '' }}
        names={['existing-model']}
        isUniqueNameError
        onChangeEntity={vi.fn()}
      />,
    );

    expect(screen.getByText(ErrorI18nKey.NameExists)).toBeInTheDocument();
  });
});
