import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AssetModel } from '@/src/models/dial/deployment-asset';
import { DeploymentInterfaceType, InterfaceMode } from '@/src/models/dial/interfaces';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import ModelView from '../View';

vi.mock('@/src/app/[lang]/platform-models/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/platform-models/actions')>()),
  updateModel: vi.fn(),
  removeModel: vi.fn(),
}));

vi.mock('@/src/context/assets/ModelsFolderContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/context/assets/ModelsFolderContext')>()),
  useModelsFolder: () => ({ fetchFiles: vi.fn() }),
}));

vi.mock('../TabsContent', () => ({
  default: ({ selectedModel, onChange, activeTab }: any) =>
    activeTab === EntityViewTab.Properties ? (
      <button onClick={() => onChange({ ...selectedModel, baseUrl: 'dial-plugin://example' })}>Use plugin</button>
    ) : (
      <div>other tab</div>
    ),
}));

let capturedJsonConfiguration: any;
vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({ jsonConfiguration, isSaveDisabled, onDiscard, onChangeActiveTab }: any) => {
    capturedJsonConfiguration = jsonConfiguration;
    return (
      <div>
        <button disabled={isSaveDisabled}>Save</button>
        <button onClick={onDiscard}>Discard</button>
        <button onClick={() => onChangeActiveTab(EntityViewTab.Interceptors)}>Other tab</button>
      </div>
    );
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

describe('ModelView — persistent plugin conflict validation', () => {
  const type = DeploymentInterfaceType.OpenAIChatCompletions;
  const overridePaths = { postAzureOpenaiChatCompletions: '/v1/chat/completions' };

  test('keeps save disabled after leaving Properties and restores validity on discard', async () => {
    const user = userEvent.setup();
    const originalModel = {
      ...model,
      baseUrl: 'https://example.com',
      interfaces: { [type]: { base_url: '', overridePaths } },
    } as AssetModel;
    render(<ModelView etag="etag" originalModel={originalModel} roles={[]} interceptors={[]} />);

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Use plugin' }));
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Other tab' }));
    expect(screen.getByText('other tab')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Discard' }));
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  test('keeps save disabled after discard when the original model still has a conflict', async () => {
    const user = userEvent.setup();
    const originalModel = {
      ...model,
      baseUrl: 'dial-plugin://example',
      interfaces: { [type]: { base_url: '', overridePaths } },
    } as AssetModel;
    render(<ModelView etag="etag" originalModel={originalModel} roles={[]} interceptors={[]} />);

    await user.click(screen.getByRole('button', { name: 'Other tab' }));
    await user.click(screen.getByRole('button', { name: 'Discard' }));
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  test.each([
    {
      name: 'an explicit plugin overrides HTTP',
      baseUrl: 'https://example.com',
      interfaceUrl: 'dial-plugin://example',
      isDisabled: true,
    },
    {
      name: 'an explicit HTTP URL overrides a plugin',
      baseUrl: 'dial-plugin://example',
      interfaceUrl: 'https://example.com',
      isDisabled: false,
    },
    {
      name: 'translator mode does not use passthrough',
      baseUrl: 'dial-plugin://example',
      mode: InterfaceMode.Translator,
      isDisabled: false,
    },
  ])('uses effective interface URL when $name', ({ baseUrl, interfaceUrl, mode, isDisabled }) => {
    const originalModel = {
      ...model,
      baseUrl,
      interfaces: { [type]: { base_url: interfaceUrl, overridePaths, mode } },
    } as AssetModel;
    render(<ModelView etag="etag" originalModel={originalModel} roles={[]} interceptors={[]} />);

    expect(screen.getByRole('button', { name: 'Save' })).toHaveProperty('disabled', isDisabled);
  });
});

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
