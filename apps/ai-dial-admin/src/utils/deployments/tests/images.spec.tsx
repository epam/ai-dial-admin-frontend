import { Image } from '@/src/models/deployments/images';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { IMAGE_SOURCE_TYPE, IMAGE_STATUS, IMAGE_TRANSPORT_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  getActionClass,
  getImageType,
  getUniqueImagesNames,
  getUniqueLatestImages,
  getVersionsList,
  isValidVersion,
  setTransport,
  updateSelectedVersion,
  validateImageChanged,
} from '../images';

vi.mock('@/src/utils/deployments/validation');

describe('images utils', () => {
  const t = (key: string) => key;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getActionClass', () => {
    test('returns class for status', () => {
      expect(getActionClass(IMAGE_STATUS.BUILT)).toBeDefined();
      expect(getActionClass(CONTAINER_STATUS.RUNNING)).toBeDefined();
    });
  });

  describe('getImageType', () => {
    test('returns correct type string', () => {
      expect(getImageType(ApplicationRoute.InterceptorContainers)).toBe('INTERCEPTOR');
      expect(getImageType(ApplicationRoute.McpContainers)).toBe('MCP');
      expect(getImageType(ApplicationRoute.AdapterContainers)).toBe('ADAPTER');
      expect(getImageType('unknown' as ApplicationRoute)).toBe('');
    });
  });

  describe('isValidVersion', () => {
    test('returns true if selected version is built', () => {
      const imageData = {
        selectedId: 'v1',
        availableVersions: [{ id: 'v1', status: IMAGE_STATUS.BUILT }],
      } as any;
      expect(isValidVersion(imageData)).toBe(true);
    });

    test('returns false if selected version is not built', () => {
      const imageData = {
        selectedId: 'v1',
        availableVersions: [{ id: 'v1', status: IMAGE_STATUS.BUILDING }],
      } as any;
      expect(isValidVersion(imageData)).toBe(false);
    });

    test('returns false if no selected version', () => {
      const imageData = {
        selectedId: '',
        availableVersions: [],
      } as any;
      expect(isValidVersion(imageData)).toBe(false);
    });
  });

  describe('validateImageChanged', () => {
    test('returns true if images are different (ignoring updatedAt and buildStatus)', () => {
      const img1 = { name: 'img', updatedAt: 1, buildStatus: 'ok' } as any;
      const img2 = { name: 'img-changed', updatedAt: 2, buildStatus: 'fail' } as any;
      expect(validateImageChanged(img1, img2)).toBe(true);
    });

    test('returns false if images are same (ignoring updatedAt and buildStatus)', () => {
      const img1 = { name: 'img', updatedAt: 1, buildStatus: 'ok' } as any;
      const img2 = { name: 'img', updatedAt: 2, buildStatus: 'fail' } as any;
      expect(validateImageChanged(img1, img2)).toBe(false);
    });
  });

  describe('getVersionsList', () => {
    test('returns list of options', () => {
      const versions = [{ id: 'v1', version: '1.0.0', status: IMAGE_STATUS.BUILT }] as any;
      const list = getVersionsList(versions);
      expect(list).toHaveLength(1);
      expect(list[0].value).toBe('v1');
      expect(list[0].label).toBe('1.0.0');
      expect(list[0].icon).toBeDefined();
    });
  });

  describe('getUniqueLatestImages', () => {
    test('returns unique images with latest version', () => {
      const images = [
        { name: 'img1', version: '1.0.0' },
        { name: 'img1', version: '2.0.0' },
        { name: 'img2', version: '1.0.0' },
      ] as any;
      const result = getUniqueLatestImages(images);
      expect(result).toHaveLength(2);
      const img1 = result.find((i) => i.name === 'img1');
      expect(img1?.version).toBe('2.0.0');
    });
  });

  describe('updateSelectedVersion', () => {
    test('updates selectedId if version exists', () => {
      const images = [
        {
          availableVersions: [{ id: 'v1' }, { id: 'v2' }],
          selectedId: 'v1',
        },
      ] as any;
      const result = updateSelectedVersion(images, 'v2');
      expect(result[0].selectedId).toBe('v2');
    });

    test('does not update if version does not exist', () => {
      const images = [
        {
          availableVersions: [{ id: 'v1' }],
          selectedId: 'v1',
        },
      ] as any;
      const result = updateSelectedVersion(images, 'v2');
      expect(result[0].selectedId).toBe('v1');
    });
  });

  describe('setTransport', () => {
    const image = {
      transportType: IMAGE_TRANSPORT_TYPE.REMOTE,
      $type: IMAGE_TYPE.INTERCEPTOR,
      buildStatus: IMAGE_STATUS.NOT_BUILT,
      id: 'id',
      name: 'name',
    };

    test('updates image and delete transportType if type is IMAGE_TYPE.INTERCEPTOR', () => {
      expect(
        setTransport({
          ...image,
          $type: IMAGE_TYPE.INTERCEPTOR,
        } as any).transportType,
      ).toBeUndefined();
    });

    test('updates image and delete transportType if type is IMAGE_TYPE.ADAPTER', () => {
      expect(
        setTransport({
          ...image,
          $type: IMAGE_TYPE.ADAPTER,
        } as any).transportType,
      ).toBeUndefined();
    });

    test('updates image with transportType is LOCAL if type is IMAGE_TYPE.MCP', () => {
      expect(
        setTransport({
          ...image,
          $type: IMAGE_TYPE.MCP,
        } as any).transportType,
      ).toBe(IMAGE_TRANSPORT_TYPE.LOCAL);
    });
  });

  describe('getUniqueImagesNames', () => {
    const createMockImage = (name: string, type: IMAGE_TYPE): Image =>
      ({
        name,
        $type: type,
        version: '1.0.0',
        source: { $type: 'docker' },
      }) as Image;

    test('should return empty array when images array is empty', () => {
      const result = getUniqueImagesNames([], IMAGE_TYPE.ADAPTER);

      expect(result).toEqual([]);
    });

    test('should return unique names for NIM type images', () => {
      const images: Image[] = [
        createMockImage('adapter-image-1', IMAGE_TYPE.ADAPTER),
        createMockImage('adapter-image-2', IMAGE_TYPE.ADAPTER),
        createMockImage('adapter-image-1', IMAGE_TYPE.ADAPTER),
      ];

      const result = getUniqueImagesNames(images, IMAGE_TYPE.ADAPTER);

      expect(result).toEqual(['adapter-image-1', 'adapter-image-2']);
      expect(result).toHaveLength(2);
    });

    test('should return unique names for MCP type images', () => {
      const images: Image[] = [
        createMockImage('mcp-image-1', IMAGE_TYPE.MCP),
        createMockImage('mcp-image-2', IMAGE_TYPE.MCP),
        createMockImage('mcp-image-1', IMAGE_TYPE.MCP),
      ];

      const result = getUniqueImagesNames(images, IMAGE_TYPE.MCP);

      expect(result).toEqual(['mcp-image-1', 'mcp-image-2']);
      expect(result).toHaveLength(2);
    });

    test('should return unique names for INTERCEPTOR type images', () => {
      const images: Image[] = [
        createMockImage('interceptor-1', IMAGE_TYPE.INTERCEPTOR),
        createMockImage('interceptor-2', IMAGE_TYPE.INTERCEPTOR),
        createMockImage('interceptor-1', IMAGE_TYPE.INTERCEPTOR),
      ];

      const result = getUniqueImagesNames(images, IMAGE_TYPE.INTERCEPTOR);

      expect(result).toEqual(['interceptor-1', 'interceptor-2']);
      expect(result).toHaveLength(2);
    });

    test('should filter out images of different type', () => {
      const images: Image[] = [
        createMockImage('adapter-image', IMAGE_TYPE.ADAPTER),
        createMockImage('mcp-image', IMAGE_TYPE.MCP),
        createMockImage('interceptor-image', IMAGE_TYPE.INTERCEPTOR),
      ];

      const resultNim = getUniqueImagesNames(images, IMAGE_TYPE.ADAPTER);
      const resultMcp = getUniqueImagesNames(images, IMAGE_TYPE.MCP);
      const resultInterceptor = getUniqueImagesNames(images, IMAGE_TYPE.INTERCEPTOR);

      expect(resultNim).toEqual(['adapter-image']);
      expect(resultMcp).toEqual(['mcp-image']);
      expect(resultInterceptor).toEqual(['interceptor-image']);
    });

    test('should return empty array when no images match the type', () => {
      const images: Image[] = [
        createMockImage('adapter-image', IMAGE_TYPE.ADAPTER),
        createMockImage('mcp-image', IMAGE_TYPE.MCP),
      ];

      const result = getUniqueImagesNames(images, IMAGE_TYPE.INTERCEPTOR);

      expect(result).toEqual([]);
    });

    test('should handle mixed types with duplicates', () => {
      const images: Image[] = [
        createMockImage('shared-name', IMAGE_TYPE.ADAPTER),
        createMockImage('shared-name', IMAGE_TYPE.MCP),
        createMockImage('shared-name', IMAGE_TYPE.ADAPTER),
        createMockImage('unique-adapter', IMAGE_TYPE.ADAPTER),
        createMockImage('unique-mcp', IMAGE_TYPE.MCP),
      ];

      const resultNim = getUniqueImagesNames(images, IMAGE_TYPE.ADAPTER);
      const resultMcp = getUniqueImagesNames(images, IMAGE_TYPE.MCP);

      expect(resultNim).toEqual(['shared-name', 'unique-adapter']);
      expect(resultMcp).toEqual(['shared-name', 'unique-mcp']);
    });

    test('should handle images with similar but not identical names', () => {
      const images: Image[] = [
        createMockImage('image', IMAGE_TYPE.ADAPTER),
        createMockImage('image-1', IMAGE_TYPE.ADAPTER),
        createMockImage('image-2', IMAGE_TYPE.ADAPTER),
        createMockImage('image', IMAGE_TYPE.ADAPTER),
      ];

      const result = getUniqueImagesNames(images, IMAGE_TYPE.ADAPTER);

      expect(result).toEqual(['image', 'image-1', 'image-2']);
      expect(result).toHaveLength(3);
    });

    test('should handle images with special characters in names', () => {
      const images: Image[] = [
        createMockImage('image-with-dash', IMAGE_TYPE.ADAPTER),
        createMockImage('image_with_underscore', IMAGE_TYPE.ADAPTER),
        createMockImage('image.with.dot', IMAGE_TYPE.ADAPTER),
        createMockImage('image-with-dash', IMAGE_TYPE.ADAPTER),
      ];

      const result = getUniqueImagesNames(images, IMAGE_TYPE.ADAPTER);

      expect(result).toEqual(['image-with-dash', 'image_with_underscore', 'image.with.dot']);
      expect(result).toHaveLength(3);
    });

    test('should handle large number of images', () => {
      const images: Image[] = Array.from({ length: 1000 }, (_, i) =>
        createMockImage(`image-${i % 100}`, IMAGE_TYPE.ADAPTER),
      );

      const result = getUniqueImagesNames(images, IMAGE_TYPE.ADAPTER);

      expect(result).toHaveLength(100);
      expect(result).toContain('image-0');
      expect(result).toContain('image-99');
    });

    test('should return unique names case-sensitively', () => {
      const images: Image[] = [
        createMockImage('ImageName', IMAGE_TYPE.ADAPTER),
        createMockImage('imagename', IMAGE_TYPE.ADAPTER),
        createMockImage('IMAGENAME', IMAGE_TYPE.ADAPTER),
      ];

      const result = getUniqueImagesNames(images, IMAGE_TYPE.ADAPTER);
      expect(result).toEqual(['ImageName', 'imagename', 'IMAGENAME']);
      expect(result).toHaveLength(3);
    });
  });
});
