import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContainersList from '../ContainersList';
import { ApplicationRoute } from '@/src/types/routes';
import { Container } from '@/src/models/deployments/containers';
import { CONTAINER_SOURCE_TYPE, CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/app/actions/deployments');

describe('ContainersList', () => {
  const mockContainers: Container[] = [
    {
      $type: CONTAINER_TYPE.MCP,
      id: '1',
      name: 'container-1',
      status: CONTAINER_STATUS.RUNNING,
      source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: 'img-1' },
      metadata: {},
    } as Container,
    {
      $type: CONTAINER_TYPE.MCP,
      id: '2',
      name: 'container-2',
      status: CONTAINER_STATUS.NOT_DEPLOYED,
      source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: 'img-2' },
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

    expect(screen.getByRole('region', { name: 'Data grid' })).toBeInTheDocument();
  });

  test('renders with empty list', () => {
    render(<ContainersList route={ApplicationRoute.ModelServings} containersList={[]} names={[]} />);

    expect(screen.getByText(EntitiesI18nKey.NoContainersType)).toBeInTheDocument();
  });

  describe('unified containers route', () => {
    test('renders the grid for mixed container types', () => {
      const mixed = [
        ...mockContainers,
        { ...mockContainers[0], id: '3', name: 'adapter-1', $type: CONTAINER_TYPE.ADAPTER },
      ];

      render(<ContainersList route={ApplicationRoute.Containers} containersList={mixed} names={[]} />);

      expect(screen.getByRole('region', { name: 'Data grid' })).toBeInTheDocument();
    });

    test('shows the generic title and empty state instead of a per-type label', () => {
      render(<ContainersList route={ApplicationRoute.Containers} containersList={[]} names={[]} />);

      expect(screen.getByText(EntitiesI18nKey.NoContainers)).toBeInTheDocument();
      expect(screen.queryByText(EntitiesI18nKey.NoContainersType)).not.toBeInTheDocument();
      expect(screen.getByText(MenuI18nKey.Containers)).toBeInTheDocument();
    });
  });
});
