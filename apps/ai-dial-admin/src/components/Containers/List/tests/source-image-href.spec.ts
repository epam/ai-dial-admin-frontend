import { describe, expect, test } from 'vitest';

import { getContainerSourceImageHref } from '@/src/components/Containers/List/source-image-href';
import { CONTAINER_SOURCE_TYPE } from '@/src/types/deployments/containers';

describe('getContainerSourceImageHref', () => {
  test('links an internal image source to the image details page', () => {
    expect(
      getContainerSourceImageHref({
        source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: 'img-1' },
      }),
    ).toBe('/deployment-images/img-1');
  });

  test.each([
    ['a Docker image reference', { $type: CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE, imageReference: 'docker.io/x' }],
    [
      'an MCP registry package',
      {
        $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE,
        imageDefinitionId: 'img-1',
        externalRegistryRef: { packageName: 'pkg' },
      },
    ],
    ['an internal image without an id', { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE }],
  ])('gives no link for %s', (_label, source) => {
    expect(getContainerSourceImageHref({ source })).toBeUndefined();
  });

  test('gives no link when the row has no source', () => {
    expect(getContainerSourceImageHref(undefined)).toBeUndefined();
  });
});
