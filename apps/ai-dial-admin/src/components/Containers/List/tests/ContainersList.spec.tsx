import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContainersList from '../ContainersList';
import { ApplicationRoute } from '@/src/types/routes';
import { Container } from '@/src/models/deployments/containers';
import { CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { EntitiesI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/app/actions/deployments');

describe('ContainersList', () => {
  const mockContainers: Container[] = [
    {
      $type: CONTAINER_TYPE.MCP,
      id: '1',
      name: 'container-1',
      status: CONTAINER_STATUS.RUNNING,
      imageDefinitionId: 'img-1',
      metadata: {},
    } as Container,
    {
      $type: CONTAINER_TYPE.MCP,
      id: '2',
      name: 'container-2',
      status: CONTAINER_STATUS.NOT_DEPLOYED,
      imageDefinitionId: 'img-2',
      metadata: {},
    } as Container,
  ];

  test('renders with containers', () => {
    render(
      <ContainersList
        route={ApplicationRoute.ModelServings}
        containersList={mockContainers}
        names={mockContainers.map((container) => container.name || '')}
      />,
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders with empty list', () => {
    render(<ContainersList route={ApplicationRoute.ModelServings} containersList={[]} names={[]} />);

    expect(screen.getByText(EntitiesI18nKey.NoContainersType)).toBeInTheDocument();
  });
});
