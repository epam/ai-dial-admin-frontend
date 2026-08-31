import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getResolvedRunnerSchema } from '@/src/app/[lang]/platform-app-runners/actions';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import AppRunnerAssetView from '../View';

vi.mock('@/src/app/[lang]/platform-app-runners/actions', () => ({
  updateRunner: vi.fn().mockResolvedValue({ success: true }),
  removeRunner: vi.fn(),
  getResolvedRunnerSchema: vi.fn().mockResolvedValue({ success: false }),
}));

vi.mock('@/src/app/[lang]/assets-applications/actions', () => ({
  createApp: vi.fn().mockResolvedValue({ success: true }),
}));

// The header's own gating is covered by its wrapper; here it only has to expose the children slot the
// create action is passed through, which `View.spec.tsx`'s save-only stub deliberately does not.
vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

const createAssetProps = vi.fn();
vi.mock('@/src/components/Assets/Deployments/CreateAsset', () => ({
  default: (props: any) => {
    createAssetProps(props);
    return <div>create-asset-modal</div>;
  },
}));

vi.mock('../TabsContent', () => ({ default: () => <div>tabs-content</div> }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

// The real dropdown keeps its items behind a floating overlay with no menu roles to query; flattening
// them to buttons keeps these tests about the action rather than the ui-kit's popover.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialButtonDropdown: ({ label, items }: any) => (
      <div>
        <span>{label}</span>
        {items?.map((item: any) => (
          <button key={item.key} onClick={() => item.onClick?.({ key: item.key })}>
            {item.label}
          </button>
        ))}
      </div>
    ),
  };
});

const CREATE_ACTION_NAME = CreateI18nKey.AssetApplication;

const runner = (overrides: Partial<DialAppRunnerResource> = {}): DialAppRunnerResource =>
  ({
    $id: 'https://host/runner',
    'dial:applicationTypeDisplayName': 'Runner',
    name: 'https%3A%2F%2Fhost%2Frunner',
    path: 'https%3A%2F%2Fhost%2Frunner',
    folderId: '',
    ...overrides,
  }) as DialAppRunnerResource;

const renderView = (entity: DialAppRunnerResource = runner()) =>
  render(
    <AppRunnerAssetView etag="etag" originalRunner={entity} roles={[]} interceptors={[]} globalInterceptors={[]} />,
  );

const openCreateModal = async (entity: DialAppRunnerResource = runner()) => {
  const user = userEvent.setup();
  renderView(entity);

  // The seeded defaults are resolved on mount, so let that settle before opening the modal — otherwise
  // the captured props read a value the user would never see. An id-less runner resolves nothing.
  if (entity.$id) {
    await waitFor(() => expect(getResolvedRunnerSchema).toHaveBeenCalled());
  }
  await user.click(screen.getByRole('button', { name: CREATE_ACTION_NAME }));
};

const lastInitialValues = () => createAssetProps.mock.calls.at(-1)?.[0].initialValues;

describe('App runner asset :: create asset application action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getResolvedRunnerSchema).mockResolvedValue({ success: false } as never);
  });

  test('Should offer the create-asset-application action under the header Create dropdown', () => {
    renderView();

    expect(screen.getByText(ButtonsI18nKey.Create)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: CREATE_ACTION_NAME })).toBeInTheDocument();
  });

  test('Should not mount the create modal until the action is used', () => {
    renderView();

    expect(screen.queryByText('create-asset-modal')).not.toBeInTheDocument();
  });

  test('Should open the shared create modal against the asset applications view', async () => {
    await openCreateModal();

    expect(screen.getByText('create-asset-modal')).toBeInTheDocument();
    expect(createAssetProps).toHaveBeenCalledWith(
      expect.objectContaining({ view: ApplicationRoute.AssetsApplications, isModalOpen: true }),
    );
  });

  test('Should seed the source with the runner Core resource reference, not the bare id', async () => {
    await openCreateModal();

    expect(lastInitialValues().source).toEqual({
      $type: SOURCE_TYPE.SCHEMA,
      applicationTypeSchemaId: 'schemas/platform/https%3A%2F%2Fhost%2Frunner',
    });
  });

  test('Should offer no source when the runner has no id to reference', async () => {
    await openCreateModal(runner({ $id: undefined }));

    expect(lastInitialValues().source).toBeUndefined();
  });

  test('Should resolve the schema against Core by the encoded resource name', () => {
    renderView();

    expect(getResolvedRunnerSchema).toHaveBeenCalledWith('https%3A%2F%2Fhost%2Frunner');
  });

  test('Should seed application properties from the Core-resolved schema', async () => {
    vi.mocked(getResolvedRunnerSchema).mockResolvedValue({
      success: true,
      response: { properties: { region: { type: 'string', default: 'eu-west' } } },
    } as never);

    await openCreateModal();

    expect(lastInitialValues().applicationProperties).toEqual({ region: 'eu-west' });
  });

  test('Should fall back to the runner own schema when Core cannot resolve it', async () => {
    await openCreateModal(
      runner({ properties: { region: { type: 'string', default: 'from-runner' } } } as Partial<DialAppRunnerResource>),
    );

    expect(lastInitialValues().applicationProperties).toEqual({ region: 'from-runner' });
  });
});
