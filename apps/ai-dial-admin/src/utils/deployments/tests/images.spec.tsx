import { Image } from '@/src/models/deployments/images';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { IMAGE_SOURCE_TYPE, IMAGE_STATUS, IMAGE_TRANSPORT_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  getActionClass,
  getImageType,
  getUniqueLatestImages,
  getVersionsList,
  isValidVersion,
  setTransport,
  updateSelectedVersion,
  validateImage,
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
      expect(getImageType(ApplicationRoute.InterceptorDeployments)).toBe('INTERCEPTOR');
      expect(getImageType(ApplicationRoute.McpContainers)).toBe('MCP');
      expect(getImageType(ApplicationRoute.ModelServings)).toBe('NIM');
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

  describe('validateImage', () => {
    const validImage: Image = {
      name: 'valid-image',
      version: '1.0.0',
      source: { $type: IMAGE_SOURCE_TYPE.DOCKER, imageUri: 'nginx' },
    } as any;

    test('returns false if name is empty', () => {
      expect(validateImage({ ...validImage, name: '' })).toBe(false);
    });

    test('returns false if version is empty', () => {
      expect(validateImage({ ...validImage, version: '' })).toBe(false);
    });

    test('returns false if transportType missing for MCP', () => {
      expect(validateImage({ ...validImage, $type: IMAGE_TYPE.MCP, transportType: undefined } as any)).toBe(false);
    });

    test('returns false if source type missing', () => {
      expect(validateImage({ ...validImage, source: {} } as any)).toBe(false);
    });

    test('returns true', () => {
      expect(validateImage(validImage)).toBe(true);
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

    test('updates image with transportType is LOCAL if type is IMAGE_TYPE.MCP', () => {
      expect(
        setTransport({
          ...image,
          $type: IMAGE_TYPE.MCP,
        } as any).transportType,
      ).toBe(IMAGE_TRANSPORT_TYPE.LOCAL);
    });
  });
});
