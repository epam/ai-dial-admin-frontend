import { act, render } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AssetModel } from '@/src/models/dial/deployment-asset';
import ModelView from '../View';

interface SimpleHeaderMockProps {
  etag?: string;
  onSave?: () => void;
}

const { simpleHeaderSpy, updateModelMock } = vi.hoisted(() => ({
  simpleHeaderSpy: vi.fn<(props: SimpleHeaderMockProps) => void>(),
  updateModelMock: vi.fn(),
}));

vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: (props: SimpleHeaderMockProps) => {
    simpleHeaderSpy(props);
    return null;
  },
}));

vi.mock('@/src/app/[lang]/platform-models/actions', () => ({
  updateModel: updateModelMock,
  removeModel: vi.fn(),
}));

vi.mock('@/src/context/assets/ModelsFolderContext', () => ({
  useModelsFolder: () => ({ fetchFiles: vi.fn() }),
}));

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ featureFlags: {} }),
}));

// Bypasses the session-validity retry logic — irrelevant to the etag behavior under test.
vi.mock('@/src/hooks/use-protected-request', () => ({
  useProtectedRequest:
    () =>
    (actionFn: (...args: unknown[]) => unknown, ...args: unknown[]) =>
      actionFn(...args),
}));

vi.mock('../TabsContent', () => ({ default: () => null }));

const model = { name: 'gpt-4', path: 'gpt-4', folderId: '' } as AssetModel;

describe('ModelView — etag refresh after a failed save', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ refresh: vi.fn(), push: vi.fn() } as unknown as ReturnType<
      typeof useRouter
    >);
  });

  const latestProps = () => simpleHeaderSpy.mock.lastCall?.[0] as SimpleHeaderMockProps;

  test('updates the etag passed to the header from a failed save response, not just a successful one', async () => {
    updateModelMock.mockResolvedValueOnce({
      success: false,
      errorHeader: 'Error',
      errorMessage: 'Validation failed',
      etag: 'fresh-etag',
    });

    render(<ModelView etag="stale-etag" originalModel={model} roles={[]} interceptors={[]} />);
    expect(latestProps().etag).toBe('stale-etag');

    await act(() => latestProps().onSave?.());

    expect(latestProps().etag).toBe('fresh-etag');
  });

  test('retries the save with the etag refreshed by the previous failure, not the one that just failed', async () => {
    updateModelMock.mockResolvedValueOnce({ success: false, etag: 'fresh-etag' });
    updateModelMock.mockResolvedValueOnce({ success: true, etag: 'fresher-etag' });

    render(<ModelView etag="stale-etag" originalModel={model} roles={[]} interceptors={[]} />);

    await act(() => latestProps().onSave?.());
    await act(() => latestProps().onSave?.());

    expect(updateModelMock).toHaveBeenNthCalledWith(1, model, 'stale-etag');
    expect(updateModelMock).toHaveBeenNthCalledWith(2, model, 'fresh-etag');
  });

  test('a successful save also updates the etag from the response', async () => {
    updateModelMock.mockResolvedValueOnce({ success: true, etag: 'saved-etag' });

    render(<ModelView etag="stale-etag" originalModel={model} roles={[]} interceptors={[]} />);

    await act(() => latestProps().onSave?.());

    expect(latestProps().etag).toBe('saved-etag');
  });
});
