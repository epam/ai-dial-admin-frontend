import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AssetModel } from '@/src/models/dial/deployment-asset';
import ModelView from '../View';

vi.mock('@/src/app/[lang]/platform-models/actions', () => ({
  updateModel: vi.fn(),
  removeModel: vi.fn(),
}));

vi.mock('@/src/context/assets/ModelsFolderContext', () => ({
  useModelsFolder: () => ({ fetchFiles: vi.fn() }),
}));

vi.mock('../TabsContent', () => ({ default: () => <div>tabs-content</div> }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

let capturedJsonConfiguration: any;
vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({ jsonConfiguration }: any) => {
    capturedJsonConfiguration = jsonConfiguration;
    return <div>header</div>;
  },
}));

const setEntityReadOnly = vi.fn();
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    featureFlags: { deploymentsEnabled: true, adminApiEnabled: true },
    setEntityReadOnly,
  }),
}));

const model = { name: 'model-1', path: 'model-1', folderId: '' } as AssetModel;

describe('ModelView — config-file source', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('marks the entity read-only on mount when config-file-sourced, and clears it on unmount', () => {
    const { unmount } = render(
      <ModelView etag="etag" originalModel={model} roles={[]} interceptors={[]} isConfigFileSource />,
    );

    expect(setEntityReadOnly).toHaveBeenCalledWith(true);

    unmount();

    expect(setEntityReadOnly).toHaveBeenLastCalledWith(false);
  });

  test('does not mark the entity read-only for an admin-backed model', () => {
    render(<ModelView etag="etag" originalModel={model} roles={[]} interceptors={[]} />);

    expect(setEntityReadOnly).toHaveBeenCalledWith(false);
  });

  test('hides the ADMIN|CORE format selector for a config-file-sourced model', () => {
    render(<ModelView etag="etag" originalModel={model} roles={[]} interceptors={[]} isConfigFileSource />);

    expect(capturedJsonConfiguration?.onHideFormatSelector?.()).toBe(true);
  });

  test('does not hide the format selector for an admin-backed model', () => {
    render(<ModelView etag="etag" originalModel={model} roles={[]} interceptors={[]} />);

    expect(capturedJsonConfiguration?.onHideFormatSelector?.()).toBe(false);
  });
});
