import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DEFAULT_ETAG } from '@/src/constants/api-headers';
import { resolveModelPricing } from '../resolve-model-pricing';

const getPlatformModelMock = vi.fn();
const getEntityModelMock = vi.fn();

vi.mock('@/src/app/[lang]/platform-models/actions', () => ({
  getModel: (...args: unknown[]) => getPlatformModelMock(...args),
}));

vi.mock('@/src/app/[lang]/models/actions', () => ({
  getModel: (...args: unknown[]) => getEntityModelMock(...args),
}));

describe('resolveModelPricing', () => {
  beforeEach(() => {
    getPlatformModelMock.mockReset();
    getEntityModelMock.mockReset();
  });

  test('resolves from the Catalog (platform) model when it exists', async () => {
    const pricing = { prompt: '0.001', completion: '0.002' };
    getPlatformModelMock.mockResolvedValue({ response: { name: 'msh-responses', pricing } });

    await expect(resolveModelPricing('msh-responses')).resolves.toEqual({ isResolved: true, pricing });
    expect(getPlatformModelMock).toHaveBeenCalledWith('msh-responses', DEFAULT_ETAG);
    expect(getEntityModelMock).not.toHaveBeenCalled();
  });

  test('strips the models/platform/ prefix before looking the name up', async () => {
    getPlatformModelMock.mockResolvedValue({ response: { name: 'msh-responses', pricing: undefined } });

    await resolveModelPricing('models/platform/msh-responses');

    expect(getPlatformModelMock).toHaveBeenCalledWith('msh-responses', DEFAULT_ETAG);
  });

  test('falls back to the Entities model when the Catalog lookup misses', async () => {
    const pricing = { prompt: '0.001' };
    getPlatformModelMock.mockResolvedValue(null);
    getEntityModelMock.mockResolvedValue({ response: { name: 'legacy-model', pricing } });

    await expect(resolveModelPricing('legacy-model')).resolves.toEqual({ isResolved: true, pricing });
    expect(getEntityModelMock).toHaveBeenCalledWith('legacy-model', DEFAULT_ETAG);
  });

  test('falls back to the Entities model when the Catalog lookup throws', async () => {
    const pricing = { completion: '0.002' };
    getPlatformModelMock.mockRejectedValue(new Error('network'));
    getEntityModelMock.mockResolvedValue({ response: { name: 'legacy-model', pricing } });

    await expect(resolveModelPricing('legacy-model')).resolves.toEqual({ isResolved: true, pricing });
  });

  test('reports a confirmed, pricing-less resource rather than treating it as unresolved', async () => {
    getPlatformModelMock.mockResolvedValue({ response: { name: 'no-price-model', pricing: undefined } });

    await expect(resolveModelPricing('no-price-model')).resolves.toEqual({ isResolved: true, pricing: undefined });
  });

  test('reports unresolved when neither surface can find the model', async () => {
    getPlatformModelMock.mockResolvedValue(null);
    getEntityModelMock.mockResolvedValue(null);

    await expect(resolveModelPricing('ghost-model')).resolves.toEqual({ isResolved: false, pricing: undefined });
  });

  test('reports unresolved rather than throwing when both surfaces fail', async () => {
    getPlatformModelMock.mockRejectedValue(new Error('network'));
    getEntityModelMock.mockRejectedValue(new Error('network'));

    await expect(resolveModelPricing('unreachable-model')).resolves.toEqual({
      isResolved: false,
      pricing: undefined,
    });
  });
});
