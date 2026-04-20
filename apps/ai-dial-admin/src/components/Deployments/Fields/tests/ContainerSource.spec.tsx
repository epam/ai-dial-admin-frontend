import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { CONTAINER_SOURCE_TYPE, CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import ContainerSource from '@/src/components/Deployments/Fields/ContainerSource';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';

vi.mock('@/src/components/Deployments/Fields/ContainerSource/InternalImageField', () => ({
  default: ({ image }: { image?: Image }) => (
    <div aria-label="internal-image-field">internal-image:{image?.name ?? 'none'}</div>
  ),
}));

describe('ContainerSource', () => {
  const baseContainer: Container = {
    $type: CONTAINER_TYPE.MCP,
    name: 'test-container',
    status: CONTAINER_STATUS.NOT_DEPLOYED,
    source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: '' },
    metadata: { envs: [] },
  };

  test('renders Docker Image Reference input for IMAGE_REFERENCE source', () => {
    const container: Container = {
      ...baseContainer,
      source: { $type: CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE, imageReference: '' },
    };

    render(<ContainerSource container={container} setContainer={vi.fn()} route={ApplicationRoute.McpContainers} />);

    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  test('renders McpServerNameField when IMAGE_REFERENCE has externalRegistryRef', () => {
    const container: Container = {
      ...baseContainer,
      source: {
        $type: CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE,
        imageReference: '',
        externalRegistryRef: { $type: SOURCE_TYPE.MCP_REGISTRY, packageName: '' },
      },
    };

    render(<ContainerSource container={container} setContainer={vi.fn()} route={ApplicationRoute.McpContainers} />);

    expect(screen.getByText('EntityFields.McpServerName')).toBeTruthy();
  });

  test('renders Docker Image Reference input for IMAGE_REFERENCE without externalRegistryRef', () => {
    const container: Container = {
      ...baseContainer,
      source: { $type: CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE, imageReference: '' },
    };

    render(<ContainerSource container={container} setContainer={vi.fn()} route={ApplicationRoute.McpContainers} />);

    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  test('renders Image URI input for NGC_REGISTRY source', () => {
    const container: Container = {
      ...baseContainer,
      $type: CONTAINER_TYPE.NIM,
      source: { $type: CONTAINER_SOURCE_TYPE.NGC_REGISTRY, imageRef: '' },
    };

    render(<ContainerSource container={container} setContainer={vi.fn()} route={ApplicationRoute.ModelServings} />);

    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  test('renders InternalImageField for INTERNAL_IMAGE source and forwards image prop', () => {
    const image = { id: 'img-1', name: 'Github', version: '1.2.1' } as Image;
    const container: Container = {
      ...baseContainer,
      source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: 'img-1' },
    };

    render(
      <ContainerSource
        container={container}
        setContainer={vi.fn()}
        image={image}
        route={ApplicationRoute.McpContainers}
      />,
    );

    expect(screen.getByLabelText('internal-image-field')).toHaveTextContent('internal-image:Github');
  });
});
