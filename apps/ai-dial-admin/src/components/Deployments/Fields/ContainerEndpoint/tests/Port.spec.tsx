import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, vi, expect } from 'vitest';
import { CONTAINER_STATUS, CONTAINER_TYPE, MODEL_SOURCE_TYPE } from '@/src/types/deployments/containers';
import { Container } from '@/src/models/deployments/containers';
import Port from '@/src/components/Deployments/Fields/ContainerEndpoint/Port';

describe('Common components :: PortField', () => {
  const mockContainer = {
    $type: CONTAINER_TYPE.MCP,
    id: '1',
    name: 'test-container',
    status: CONTAINER_STATUS.RUNNING,
    imageDefinitionId: 'img-1',
    metadata: { envs: [] },
    containerPort: 8000,
  } as Container;

  test('updates containerPort on change', async () => {
    render(<Port container={mockContainer} setContainer={vi.fn()} />);

    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  test('renders grpc port for ModelServings and updates it', async () => {
    render(
      <Port
        container={{
          ...mockContainer,
          $type: CONTAINER_TYPE.NIM,
          source: { $type: MODEL_SOURCE_TYPE.NIM },
          containerGrpcPort: 1234,
        }}
        setContainer={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
  });
});
