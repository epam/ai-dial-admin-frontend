import { describe, expect, test } from 'vitest';

import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { DeploymentExportEntityType } from '@/src/types/deployments/export';
import { CONTAINER_SOURCE_TYPE, CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { IMAGE_STATUS, IMAGE_TYPE } from '@/src/types/deployments/images';
import { getContainersForEntitiesGrid, getImagesForEntitiesGrid } from '../deployment-entities-list-view';

const mockContainer = (overrides?: Partial<Container>): Container => ({
  $type: CONTAINER_TYPE.MCP,
  name: 'test-container',
  displayName: 'Test Container',
  description: 'A test container',
  source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: 'img-1' },
  status: CONTAINER_STATUS.RUNNING,
  metadata: {},
  ...overrides,
});

const mockImage = (overrides?: Partial<Image>): Image => ({
  $type: IMAGE_TYPE.MCP,
  id: 'img-1',
  name: 'test-image',
  displayName: 'Test Image',
  description: 'A test image',
  version: '1.0.0',
  buildStatus: IMAGE_STATUS.BUILT,
  source: { $type: 'docker' as any },
  ...overrides,
});

describe('Utils :: getContainersForEntitiesGrid', () => {
  test('maps containers to grid data with entity type', () => {
    const containers = [mockContainer({ name: 'c1' }), mockContainer({ name: 'c2' })];
    const result = getContainersForEntitiesGrid(containers, DeploymentExportEntityType.MCP_CONTAINER);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('c1');
    expect(result[0].type).toBe(DeploymentExportEntityType.MCP_CONTAINER);
    expect(result[1].name).toBe('c2');
    expect(result[1].type).toBe(DeploymentExportEntityType.MCP_CONTAINER);
  });

  test('preserves container properties', () => {
    const container = mockContainer({ displayName: 'My Container', description: 'desc' });
    const result = getContainersForEntitiesGrid([container], DeploymentExportEntityType.ADAPTER_CONTAINER);

    expect(result[0].displayName).toBe('My Container');
    expect(result[0].description).toBe('desc');
  });

  test('returns empty array for null input', () => {
    expect(getContainersForEntitiesGrid(null, DeploymentExportEntityType.MCP_CONTAINER)).toEqual([]);
  });

  test('returns empty array for undefined input', () => {
    expect(getContainersForEntitiesGrid(undefined, DeploymentExportEntityType.MCP_CONTAINER)).toEqual([]);
  });

  test('returns empty array for empty array input', () => {
    expect(getContainersForEntitiesGrid([], DeploymentExportEntityType.MCP_CONTAINER)).toEqual([]);
  });
});

describe('Utils :: getImagesForEntitiesGrid', () => {
  test('maps images to grid data with IMAGE type', () => {
    const images = [mockImage({ name: 'img-a' }), mockImage({ name: 'img-b' })];
    const result = getImagesForEntitiesGrid(images);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('img-a');
    expect(result[0].type).toBe(DeploymentExportEntityType.IMAGE);
    expect(result[1].name).toBe('img-b');
    expect(result[1].type).toBe(DeploymentExportEntityType.IMAGE);
  });

  test('preserves image properties', () => {
    const image = mockImage({ id: 'my-id', displayName: 'My Image', version: '2.0' });
    const result = getImagesForEntitiesGrid([image]);

    expect((result[0] as any).id).toBe('my-id');
    expect(result[0].displayName).toBe('My Image');
    expect((result[0] as any).version).toBe('2.0');
  });

  test('returns empty array for null input', () => {
    expect(getImagesForEntitiesGrid(null)).toEqual([]);
  });

  test('returns empty array for undefined input', () => {
    expect(getImagesForEntitiesGrid(undefined)).toEqual([]);
  });

  test('returns empty array for empty array input', () => {
    expect(getImagesForEntitiesGrid([])).toEqual([]);
  });
});
