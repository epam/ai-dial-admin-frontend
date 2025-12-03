import { describe, expect, test, vi, beforeEach } from 'vitest';
import {
  getActionClass,
  getImageTemplate,
  getImageType,
  getSourcesTypes,
  getUniqueLatestImages,
  getVersionsList,
  isValidVersion,
  updateSelectedVersion,
  validateImage,
  validateImageChanged,
} from '../images';
import { ApplicationRoute } from '@/src/types/routes';
import { IMAGE_SOURCE_TYPE, IMAGE_STATUS, IMAGE_TYPE } from '@/src/types/deployments/images';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { getDeploymentsURIError, getDeploymentsURLError } from '@/src/utils/deployments/validation';
import { Image } from '@/src/models/deployments/images';

vi.mock('@/src/utils/deployments/validation');

describe('images utils', () => {
  const t = (key: string) => key;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSourcesTypes', () => {
    test('returns sources with translated labels', () => {
      const sources = getSourcesTypes(t);
      expect(sources.length).toBeGreaterThan(0);
      expect(sources[0]).toHaveProperty('label');
    });
  });

  describe('getActionClass', () => {
    test('returns class for status', () => {
      expect(getActionClass(IMAGE_STATUS.BUILT)).toBeDefined();
      expect(getActionClass(CONTAINER_STATUS.RUNNING)).toBeDefined();
    });
  });

  describe('getImageTemplate', () => {
    test('returns template for InterceptorDeployments', () => {
      const template = getImageTemplate(ApplicationRoute.InterceptorDeployments);
      expect(template?.$type).toBe(IMAGE_TYPE.INTERCEPTOR);
    });

    test('returns template for McpDeployments', () => {
      const template = getImageTemplate(ApplicationRoute.McpDeployments);
      expect(template?.$type).toBe(IMAGE_TYPE.MCP);
    });

    test('returns template for ModelDeployments', () => {
      const template = getImageTemplate(ApplicationRoute.ModelDeployments);
      expect(template?.$type).toBe(IMAGE_TYPE.MODEL);
    });

    test('returns null for unknown route', () => {
      expect(getImageTemplate('unknown' as ApplicationRoute)).toBeNull();
    });
  });

  describe('getImageType', () => {
    test('returns correct type string', () => {
      expect(getImageType(ApplicationRoute.InterceptorDeployments)).toBe('INTERCEPTOR');
      expect(getImageType(ApplicationRoute.McpDeployments)).toBe('MCP');
      expect(getImageType(ApplicationRoute.ModelDeployments)).toBe('NIM');
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

    test('returns false if code url empty', () => {
      const image = { ...validImage, source: { $type: IMAGE_SOURCE_TYPE.CODE, url: '' } } as any;
      expect(validateImage(image)).toBe(false);
    });

    test('returns false if code url invalid', () => {
      (getDeploymentsURLError as any).mockReturnValue('URL Error');
      const image = { ...validImage, source: { $type: IMAGE_SOURCE_TYPE.CODE, url: 'invalid' } } as any;
      expect(validateImage(image)).toBe(false);
    });

    test('returns false if docker uri empty', () => {
      const image = { ...validImage, source: { $type: IMAGE_SOURCE_TYPE.DOCKER, imageUri: '' } } as any;
      expect(validateImage(image)).toBe(false);
    });

    test('returns false if docker uri invalid', () => {
      (getDeploymentsURIError as any).mockReturnValue('URI Error');
      const image = { ...validImage, source: { $type: IMAGE_SOURCE_TYPE.DOCKER, imageUri: 'invalid' } } as any;
      expect(validateImage(image)).toBe(false);
    });

    test('returns true for valid image', () => {
      (getDeploymentsURIError as any).mockReturnValue(null);
      (getDeploymentsURLError as any).mockReturnValue(null);
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
});
