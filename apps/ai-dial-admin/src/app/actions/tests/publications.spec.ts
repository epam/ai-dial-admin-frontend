import { beforeEach, describe, expect, test, vi } from 'vitest';

import { publicationsApi } from '@/src/app/api/api';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { RESPONSE_MOCK, TOKEN_MOCK } from '@/src/utils/tests/mock/api.mock';
import { approvePublication, declinePublication, deletePublication, updatePublication } from '../publications';
import { Publication } from '@/src/models/dial/publications';

vi.mock('@/src/utils/auth/auth-request');
vi.mock('@/src/utils/env/get-auth-toggle');
vi.mock('@/src/app/api/api');

describe('Publications :: server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getUserToken as any).mockResolvedValue(TOKEN_MOCK);
    (getIsEnableAuthToggle as any).mockReturnValue(true);
  });

  test('Should call approvePublication action', async () => {
    (publicationsApi.approvePublication as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await approvePublication('test');
    expect(getUserToken).toHaveBeenCalled();
    expect(publicationsApi.approvePublication).toHaveBeenCalledWith(TOKEN_MOCK, 'test');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call declinePublication action', async () => {
    (publicationsApi.declinePublication as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await declinePublication('path', 'test');
    expect(getUserToken).toHaveBeenCalled();
    expect(publicationsApi.declinePublication).toHaveBeenCalledWith(TOKEN_MOCK, 'path', 'test');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call deletePublication action', async () => {
    (publicationsApi.deletePublication as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await deletePublication('path');
    expect(getUserToken).toHaveBeenCalled();
    expect(publicationsApi.deletePublication).toHaveBeenCalledWith(TOKEN_MOCK, 'path');
    expect(result).toBe(RESPONSE_MOCK);
  });

  test('Should call updatePublication action', async () => {
    (publicationsApi.updatePublication as any).mockResolvedValue(RESPONSE_MOCK);

    const result = await updatePublication({ folderId: 'path' } as Publication);
    expect(getUserToken).toHaveBeenCalled();
    expect(publicationsApi.updatePublication).toHaveBeenCalledWith(TOKEN_MOCK, { folderId: 'path' });
    expect(result).toBe(RESPONSE_MOCK);
  });
});
