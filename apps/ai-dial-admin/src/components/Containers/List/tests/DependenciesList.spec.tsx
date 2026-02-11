import { Container } from '@/src/models/deployments/containers';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { EntitiesI18nKey } from '../../../../constants/i18n';
import DependenciesList from '../DependenciesList';

describe('DependenciesList', () => {
  const mockContainers: Container[] = [
    {
      id: '1',
      name: 'container-1',
      status: CONTAINER_STATUS.RUNNING,
      imageDefinitionId: 'img-1',
    } as Container,
    {
      id: '2',
      name: 'container-2',
      status: CONTAINER_STATUS.NOT_DEPLOYED,
      imageDefinitionId: 'img-2',
    } as Container,
  ];

  test('renders grid with containers', () => {
    render(<DependenciesList containerList={mockContainers} route={ApplicationRoute.ModelServings} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders with empty list', () => {
    render(<DependenciesList containerList={[]} route={ApplicationRoute.ModelServings} />);

    expect(screen.getByText(EntitiesI18nKey.NoContainers)).toBeInTheDocument();
  });
});
