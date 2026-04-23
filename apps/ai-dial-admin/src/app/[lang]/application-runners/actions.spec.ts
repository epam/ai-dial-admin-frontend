import { beforeEach, describe, expect, test, vi } from 'vitest';

import { applicationRunnersApi } from '@/src/app/api/api';
import { ApplicationMCPConfigDelivery } from '@/src/models/dial/application';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import {
  createApplicationScheme,
  getApplicationScheme,
  getCoreRunner,
  getResolvedApplicationScheme,
  removeApplicationScheme,
  updateApplicationScheme,
  updateCoreRunner,
} from './actions';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Applications schemes :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call getCoreRunner action', async () => {
    (applicationRunnersApi.getCoreRunner as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getCoreRunner('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationRunnersApi.getCoreRunner).toHaveBeenCalledWith('test', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should transform uppercase config delivery to lowercase in getCoreRunner', async () => {
    const mockResponse = {
      success: true,
      response: {
        $id: 'test',
        'dial:applicationTypeMcp': {
          'dial:endpoint': 'http://example.com',
          'dial:mcpConfigDelivery': 'HEADER',
        },
      },
    };
    (applicationRunnersApi.getCoreRunner as any).mockResolvedValue(mockResponse);

    const result = await getCoreRunner('test');

    expect(result.response?.['dial:applicationTypeMcp']?.['dial:mcpConfigDelivery']).toBe('header');
  });

  test('Should call removeApplicationScheme action', async () => {
    (applicationRunnersApi.removeApplicationScheme as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await removeApplicationScheme('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationRunnersApi.removeApplicationScheme).toHaveBeenCalledWith(TOKEN_MOCK, 'test');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call createApplicationScheme action', async () => {
    (applicationRunnersApi.createApplicationScheme as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await createApplicationScheme({ $id: 'test' });
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationRunnersApi.createApplicationScheme).toHaveBeenCalledWith({ $id: 'test' }, TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateApplicationScheme action', async () => {
    (applicationRunnersApi.updateApplicationScheme as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateApplicationScheme({ $id: 'test' }, 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationRunnersApi.updateApplicationScheme).toHaveBeenCalledWith({ $id: 'test' }, TOKEN_MOCK, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updateCoreRunner action', async () => {
    (applicationRunnersApi.updateCoreRunner as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updateCoreRunner({ $id: 'test' }, 'test', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationRunnersApi.updateCoreRunner).toHaveBeenCalledWith({ $id: 'test' }, 'test', 'etag', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call getApplicationScheme action', async () => {
    (applicationRunnersApi.getApplicationScheme as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getApplicationScheme('test', 'etag');
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationRunnersApi.getApplicationScheme).toHaveBeenCalledWith('test', TOKEN_MOCK, 'etag');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should transform uppercase config delivery to lowercase in getApplicationScheme', async () => {
    const mockResponse = {
      success: true,
      response: {
        $id: 'test',
        'dial:applicationTypeMcp': {
          'dial:endpoint': 'http://example.com',
          'dial:mcpConfigDelivery': 'META',
        },
      },
    };
    (applicationRunnersApi.getApplicationScheme as any).mockResolvedValue(mockResponse);

    const result = await getApplicationScheme('test', 'etag');

    expect(result.response?.['dial:applicationTypeMcp']?.['dial:mcpConfigDelivery']).toBe('meta');
  });

  test('Should call getResolvedApplicationScheme action', async () => {
    (applicationRunnersApi.getResolvedApplicationScheme as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await getResolvedApplicationScheme('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(applicationRunnersApi.getResolvedApplicationScheme).toHaveBeenCalledWith('test', TOKEN_MOCK);
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should transform uppercase config delivery to lowercase in getResolvedApplicationScheme', async () => {
    const mockResponse = {
      success: true,
      response: {
        $id: 'test',
        'dial:applicationTypeMcp': {
          'dial:endpoint': 'http://example.com',
          'dial:mcpConfigDelivery': 'META',
        },
      },
    };
    (applicationRunnersApi.getResolvedApplicationScheme as any).mockResolvedValue(mockResponse);

    const result = await getResolvedApplicationScheme('test');

    expect(result.response?.['dial:applicationTypeMcp']?.['dial:mcpConfigDelivery']).toBe('meta');
  });

  describe('MCP Config Delivery Transformation', () => {
    test('Should transform lowercase "meta" to uppercase "META" in createApplicationScheme', async () => {
      (applicationRunnersApi.createApplicationScheme as any).mockResolvedValue(RESPONSE_MOCK);

      const scheme = {
        $id: 'test',
        'dial:applicationTypeMcp': {
          'dial:endpoint': 'http://example.com',
          'dial:mcpConfigDelivery': ApplicationMCPConfigDelivery.META,
        },
      };

      await createApplicationScheme(scheme);

      expect(applicationRunnersApi.createApplicationScheme).toHaveBeenCalledWith(
        {
          $id: 'test',
          'dial:applicationTypeMcp': {
            'dial:endpoint': 'http://example.com',
            'dial:mcpConfigDelivery': 'META',
          },
        },
        TOKEN_MOCK,
      );
    });

    test('Should transform lowercase "header" to uppercase "HEADER" in createApplicationScheme', async () => {
      (applicationRunnersApi.createApplicationScheme as any).mockResolvedValue(RESPONSE_MOCK);

      const scheme = {
        $id: 'test',
        'dial:applicationTypeMcp': {
          'dial:endpoint': 'http://example.com',
          'dial:mcpConfigDelivery': ApplicationMCPConfigDelivery.HEADER,
        },
      };

      await createApplicationScheme(scheme);

      expect(applicationRunnersApi.createApplicationScheme).toHaveBeenCalledWith(
        {
          $id: 'test',
          'dial:applicationTypeMcp': {
            'dial:endpoint': 'http://example.com',
            'dial:mcpConfigDelivery': 'HEADER',
          },
        },
        TOKEN_MOCK,
      );
    });

    test('Should not modify scheme when dial:applicationTypeMcp is absent', async () => {
      (applicationRunnersApi.createApplicationScheme as any).mockResolvedValue(RESPONSE_MOCK);

      const scheme = { $id: 'test' };

      await createApplicationScheme(scheme);

      expect(applicationRunnersApi.createApplicationScheme).toHaveBeenCalledWith({ $id: 'test' }, TOKEN_MOCK);
    });

    test('Should not modify scheme when dial:mcpConfigDelivery is absent', async () => {
      (applicationRunnersApi.createApplicationScheme as any).mockResolvedValue(RESPONSE_MOCK);

      const scheme = {
        $id: 'test',
        'dial:applicationTypeMcp': {
          'dial:endpoint': 'http://example.com',
        },
      };

      await createApplicationScheme(scheme);

      expect(applicationRunnersApi.createApplicationScheme).toHaveBeenCalledWith(
        {
          $id: 'test',
          'dial:applicationTypeMcp': {
            'dial:endpoint': 'http://example.com',
          },
        },
        TOKEN_MOCK,
      );
    });

    test('Should preserve all other MCP properties during transformation', async () => {
      (applicationRunnersApi.createApplicationScheme as any).mockResolvedValue(RESPONSE_MOCK);

      const scheme = {
        $id: 'test',
        'dial:applicationTypeMcp': {
          'dial:endpoint': 'http://example.com',
          'dial:transport': 'http',
          'dial:forwardPerRequestKey': true,
          'dial:allowedTools': ['tool1', 'tool2'],
          'dial:mcpConfigDelivery': ApplicationMCPConfigDelivery.META,
        },
      };

      await createApplicationScheme(scheme);

      expect(applicationRunnersApi.createApplicationScheme).toHaveBeenCalledWith(
        {
          $id: 'test',
          'dial:applicationTypeMcp': {
            'dial:endpoint': 'http://example.com',
            'dial:transport': 'http',
            'dial:forwardPerRequestKey': true,
            'dial:allowedTools': ['tool1', 'tool2'],
            'dial:mcpConfigDelivery': 'META',
          },
        },
        TOKEN_MOCK,
      );
    });

    test('Should transform config delivery in updateApplicationScheme', async () => {
      (applicationRunnersApi.updateApplicationScheme as any).mockResolvedValue(RESPONSE_MOCK);

      const scheme = {
        $id: 'test',
        'dial:applicationTypeMcp': {
          'dial:endpoint': 'http://example.com',
          'dial:mcpConfigDelivery': ApplicationMCPConfigDelivery.HEADER,
        },
      };

      await updateApplicationScheme(scheme, 'etag');

      expect(applicationRunnersApi.updateApplicationScheme).toHaveBeenCalledWith(
        {
          $id: 'test',
          'dial:applicationTypeMcp': {
            'dial:endpoint': 'http://example.com',
            'dial:mcpConfigDelivery': 'HEADER',
          },
        },
        TOKEN_MOCK,
        'etag',
      );
    });

    test('Should transform config delivery in updateCoreRunner', async () => {
      (applicationRunnersApi.updateCoreRunner as any).mockResolvedValue(RESPONSE_MOCK);

      const scheme = {
        $id: 'test',
        'dial:applicationTypeMcp': {
          'dial:endpoint': 'http://example.com',
          'dial:mcpConfigDelivery': ApplicationMCPConfigDelivery.META,
        },
      };

      await updateCoreRunner(scheme, 'test', 'etag');

      expect(applicationRunnersApi.updateCoreRunner).toHaveBeenCalledWith(
        {
          $id: 'test',
          'dial:applicationTypeMcp': {
            'dial:endpoint': 'http://example.com',
            'dial:mcpConfigDelivery': 'META',
          },
        },
        'test',
        'etag',
        TOKEN_MOCK,
      );
    });
  });
});
