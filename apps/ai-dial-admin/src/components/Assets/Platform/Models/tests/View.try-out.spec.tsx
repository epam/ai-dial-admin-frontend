import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { AssetModel } from '@/src/models/dial/deployment-asset';
import { appContextMock } from '@/test-mocks/app-context';
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
vi.mock('../TabsContent', () => ({ default: () => <div /> }));
vi.mock('@/src/components/TryOut/Deployment/DeploymentTryOut', () => ({
  default: ({ deployment }: { deployment: string }) => <div>panel:{deployment}</div>,
}));

const renderView = (model: Partial<AssetModel> = { name: 'gpt-4', path: 'gpt-4', folderId: '' }) =>
  render(<ModelView etag="etag" originalModel={model as AssetModel} roles={[]} interceptors={[]} />);

describe('ModelView — Try out', () => {
  beforeEach(() => {
    appContextMock.use(() => ({
      featureFlags: { deploymentsEnabled: true, adminApiEnabled: true },
      isReadOnlyAdmin: false,
      setEntityReadOnly: vi.fn(),
    }));
  });

  test('shows the Try out button beside Delete', () => {
    renderView();

    const tryOut = screen.getByRole('button', { name: ButtonsI18nKey.TryOut });
    const deleteButtons = screen.getAllByRole('button', { name: ButtonsI18nKey.Delete });

    expect(deleteButtons.some((button) => button.parentElement?.contains(tryOut))).toBe(true);
  });

  test('opens the panel for the model by its canonical platform id', async () => {
    renderView();

    await userEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.TryOut }));

    const [content] = appContextMock.sidebar.showSidebar.mock.calls[0];
    render(<>{content}</>);
    expect(screen.getByText('panel:models/platform/gpt-4')).toBeInTheDocument();
  });

  test('shows no Try out button for a model without a name', () => {
    renderView({ path: '', folderId: '' });

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.TryOut })).toBeNull();
  });

  test('hides the Try out button while the JSON editor is open', async () => {
    renderView();

    await userEvent.click(screen.getByRole('switch', { name: EntitiesI18nKey.JSONEditor }));

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.TryOut })).toBeNull();
  });
});
