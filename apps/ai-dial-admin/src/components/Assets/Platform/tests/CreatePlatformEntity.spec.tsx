import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getResolvedRunnerSchema } from '@/src/app/[lang]/platform-app-runners/actions';
import { getCatalogSchemaById } from '@/src/app/[lang]/platform-catalog-schemas/actions';
import { CreateAssetActionMap, PlatformCreateAssetActionMap } from '@/src/components/Assets/BaseAssetList/utils';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ButtonsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { NotificationType } from '@/src/models/notification';
import { ApplicationRoute } from '@/src/types/routes';
import CreatePlatformEntity from '../CreatePlatformEntity';

vi.mock('@/src/app/[lang]/platform-app-runners/actions', () => ({ getResolvedRunnerSchema: vi.fn() }));
vi.mock('@/src/app/[lang]/platform-catalog-schemas/actions', () => ({ getCatalogSchemaById: vi.fn() }));
vi.mock('@/src/hooks/use-protected-request', () => ({
  useProtectedRequest:
    () =>
    (action: (...args: unknown[]) => unknown, ...args: unknown[]) =>
      action(...args),
}));

vi.mock('@/src/components/Assets/BaseAssetList/utils', () => ({
  CreateAssetActionMap: {
    '/platform-models': vi.fn(),
    '/platform-app-runners': vi.fn(),
    '/platform-catalog-schemas': vi.fn(),
    '/platform-policies': vi.fn(),
  },
  PlatformCreateAssetActionMap: { '/assets-toolsets': vi.fn(), '/assets-applications': vi.fn() },
}));

vi.mock('@/src/components/Assets/Platform/Keys/CreateKeyModal', () => ({
  default: ({ names }: { names: string[] }) => <div>create-key:{names.join(',')}</div>,
}));
vi.mock('@/src/components/Assets/Platform/PolicySubjects/CreatePolicyModal', () => ({
  default: ({ route, onCreate }: { route: string; onCreate: unknown }) => (
    <div>
      create-policy:{route}:{String(onCreate === (CreateAssetActionMap as Record<string, unknown>)[route])}
    </div>
  ),
}));
vi.mock('@/src/components/Assets/Entities/Apps/CreateApplication', () => ({
  default: ({ isPlatform, initialValues, onCreate }: any) => (
    <div>
      create-application:platform={String(isPlatform)}:schema={initialValues?.application_type_schema_id}:wired=
      {String(onCreate === (PlatformCreateAssetActionMap as Record<string, unknown>)['/assets-applications'])}
    </div>
  ),
}));

// The per-view property forms are covered by their own specs; a single text input drives `name` / `$id` here.
vi.mock('@/src/components/EntityMainProperties/Properties/Properties', () => ({
  default: ({ entity, onChangeEntity, externalIdError }: any) => (
    <div>
      <input
        aria-label="entity-name"
        value={entity.name ?? ''}
        onChange={(event) => onChangeEntity({ ...entity, name: event.target.value, $id: `id-${event.target.value}` })}
      />
      <span>{externalIdError}</span>
    </div>
  ),
}));

const push = vi.fn();
const onClose = vi.fn();
const createAction = (key: string) => (CreateAssetActionMap as Record<string, ReturnType<typeof vi.fn>>)[key];
const platformAction = (key: string) => (PlatformCreateAssetActionMap as Record<string, ReturnType<typeof vi.fn>>)[key];

const renderPopup = (view: ApplicationRoute, extra: Record<string, unknown> = {}) =>
  render(<CreatePlatformEntity view={view} isOpen names={['taken']} onClose={onClose} {...extra} />);

describe('CreatePlatformEntity :: per-view switch', () => {
  test('renders the key modal for keys', () => {
    renderPopup(ApplicationRoute.PlatformKeys);

    expect(screen.getByText('create-key:taken')).toBeInTheDocument();
  });

  test('renders the policy modal wired to the policy create action, without any folder context', () => {
    renderPopup(ApplicationRoute.PlatformPolicies);

    expect(screen.getByText(`create-policy:${ApplicationRoute.PlatformPolicies}:true`)).toBeInTheDocument();
  });

  test('renders the application form in platform mode, translating a schema source into a schema id', () => {
    renderPopup(ApplicationRoute.AssetsApplications, {
      initialValues: { source: { $type: SOURCE_TYPE.SCHEMA, applicationTypeSchemaId: 'runner-1' } },
    });

    expect(screen.getByText(/create-application:platform=true:schema=runner-1:wired=true/)).toBeInTheDocument();
  });

  test('renders the generic platform form for every other view', () => {
    renderPopup(ApplicationRoute.PlatformModels);

    expect(screen.getByRole('textbox', { name: 'entity-name' })).toBeInTheDocument();
  });
});

describe('CreatePlatformEntity :: generic form', () => {
  const { showNotification } = useNotification();

  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push } as never);
    vi.mocked(getResolvedRunnerSchema).mockResolvedValue({ success: false });
    vi.mocked(getCatalogSchemaById).mockResolvedValue({ success: false });
  });

  test('creates through the view action, notifies and redirects to the flat platform route', async () => {
    createAction('/platform-models').mockResolvedValue({ success: true, response: { name: 'gpt' } });
    renderPopup(ApplicationRoute.PlatformModels);

    fireEvent.change(screen.getByRole('textbox', { name: 'entity-name' }), { target: { value: 'gpt' } });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await vi.waitFor(() => expect(push).toHaveBeenCalledWith('/platform-models/gpt'));
    expect(createAction('/platform-models')).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'gpt', folderId: 'platform/' }),
    );
    expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ type: NotificationType.success }));
    expect(onClose).toHaveBeenCalled();
  });

  test('uses the platform-bucket action for a toolset, which also has a Public tree', async () => {
    platformAction('/assets-toolsets').mockResolvedValue({ success: true });
    renderPopup(ApplicationRoute.AssetsToolsets);

    fireEvent.change(screen.getByRole('textbox', { name: 'entity-name' }), { target: { value: 'mcp' } });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await vi.waitFor(() =>
      expect(platformAction('/assets-toolsets')).toHaveBeenCalledWith(expect.objectContaining({ name: 'mcp' })),
    );
    expect(createAction('/platform-models')).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/assets-toolsets/mcp');
  });

  test('keeps the popup open and shows the error when Core refuses the create', async () => {
    createAction('/platform-models').mockResolvedValue({
      success: false,
      errorHeader: 'Conflict',
      errorMessage: 'exists',
    });
    renderPopup(ApplicationRoute.PlatformModels);

    fireEvent.change(screen.getByRole('textbox', { name: 'entity-name' }), { target: { value: 'gpt' } });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await vi.waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.error, title: 'Conflict' }),
      ),
    );
    expect(push).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  test.each([
    [ApplicationRoute.PlatformAppRunners, getResolvedRunnerSchema],
    [ApplicationRoute.PlatformCatalogSchemas, getCatalogSchemaById],
  ])('refuses a taken declared id before writing for %s', async (view, getById) => {
    vi.mocked(getById).mockResolvedValue({ success: true, response: { name: 'existing' } });
    renderPopup(view);

    fireEvent.change(screen.getByRole('textbox', { name: 'entity-name' }), { target: { value: 'x' } });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    expect(await screen.findByText(ErrorI18nKey.NameExists)).toBeInTheDocument();
    expect(getById).toHaveBeenCalledWith('id-x');
    expect(createAction(view)).not.toHaveBeenCalled();
  });

  test('writes anyway when the declared id lookup itself fails', async () => {
    vi.mocked(getResolvedRunnerSchema).mockRejectedValue(new Error('down'));
    createAction('/platform-app-runners').mockResolvedValue({ success: true });
    renderPopup(ApplicationRoute.PlatformAppRunners);

    fireEvent.change(screen.getByRole('textbox', { name: 'entity-name' }), { target: { value: 'x' } });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await vi.waitFor(() => expect(createAction('/platform-app-runners')).toHaveBeenCalled());
  });
});
