import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Container } from '@/src/models/deployments/containers';
import { CONTAINER_SOURCE_TYPE, CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import ContainerSource from '@/src/components/Deployments/Fields/ContainerSource';

describe('ContainerSource', () => {
  const baseContainer: Container = {
    $type: CONTAINER_TYPE.MCP,
    name: 'test-container',
    status: CONTAINER_STATUS.NOT_DEPLOYED,
    metadata: { envs: [] },
  } as Container;

  test('renders Docker Image Reference input for IMAGE_REFERENCE source', () => {
    const container: Container = {
      ...baseContainer,
      source: { $type: CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE, imageReference: '' },
    };

    render(
      <ContainerSource
        container={container}
        setContainer={vi.fn()}
        route={ApplicationRoute.McpContainers}
      />,
    );

    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  test('renders Image URI input for NGC_REGISTRY source', () => {
    const container: Container = {
      ...baseContainer,
      $type: CONTAINER_TYPE.NIM,
      source: { $type: CONTAINER_SOURCE_TYPE.NGC_REGISTRY, imageRef: '' },
    };

    render(
      <ContainerSource
        container={container}
        setContainer={vi.fn()}
        route={ApplicationRoute.ModelServings}
      />,
    );

    expect(screen.getByRole('textbox')).toBeTruthy();
  });
});
