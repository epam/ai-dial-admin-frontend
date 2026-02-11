import { describe, expect, test, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Container } from '@/src/models/deployments/containers';
import { CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import ContainerResources from '@/src/components/Deployments/Fields/ContainerResources';

describe('ContainerResourcesFields', () => {
  const mockContainer: Container = {
    $type: CONTAINER_TYPE.MCP,
    id: '1',
    name: 'test-container',
    status: CONTAINER_STATUS.RUNNING,
    imageDefinitionId: 'img-1',
    metadata: { envs: [] },
    resources: {
      requests: { cpu: '1', memory: '2Gi' },
      limits: { cpu: '2', memory: '4Gi' },
    },
  } as Container;

  test('renders component', () => {
    const { container } = render(
      <ContainerResources container={mockContainer} setContainer={vi.fn()} route={ApplicationRoute.McpContainers} />,
    );

    expect(container).toBeTruthy();
  });
});
