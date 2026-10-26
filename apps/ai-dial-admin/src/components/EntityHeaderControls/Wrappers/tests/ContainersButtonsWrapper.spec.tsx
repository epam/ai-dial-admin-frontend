import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test, vi } from 'vitest';

import ContainersButtonsWrapper from '@/src/components/EntityHeaderControls/Wrappers/ContainersButtonsWrapper';
import { ButtonsI18nKey, CreateI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { Container } from '@/src/models/deployments/containers';
import {
  CONTAINER_SOURCE_TYPE,
  CONTAINER_STATUS,
  CONTAINER_TYPE,
  INFERENCE_TASK,
} from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({ useIsReadOnlyAdmin: () => false }));
vi.mock('@/src/hooks/use-is-mobile-screen', () => ({ useIsMobileScreen: () => false }));
vi.mock('@/src/hooks/use-is-tablet-screen', () => ({ useIsOnlyTabletScreen: () => false }));

// Heavy children — assert on the wrapper's wiring, not their internals.
vi.mock('@/src/components/EntityListView/CreateEntity/CreateEntity', () => ({
  default: ({ route, createEntity, isModal, names }: any) => (
    <div>
      <span>modal-route:{route}</span>
      <span>modal-is-modal:{String(!!isModal)}</span>
      <span>modal-names:{names?.join(',')}</span>
      <button onClick={() => createEntity({ name: 'x' })}>invoke-create</button>
    </div>
  ),
}));
vi.mock('@/src/components/Assets/Modals/CreateAsset', () => ({
  default: ({ view, shouldOpenOnPlatform }: any) => (
    <div>
      <span>asset-view:{view}</span>
      <span>asset-opens-on-platform:{String(!!shouldOpenOnPlatform)}</span>
    </div>
  ),
}));

// The real dropdown keeps its items behind a floating overlay with no menu roles to query; flattening
// them to buttons keeps these tests about the action rather than the ui-kit's popover.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    ButtonDropdown: ({ label, items }: any) => (
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
vi.mock('@/src/components/EntityView/Modals/Delete/Delete', () => ({ default: () => null }));

const baseContainer = (inferenceTask?: INFERENCE_TASK): Container => ({
  name: 'serving-1',
  displayName: 'Serving 1',
  $type: CONTAINER_TYPE.HF,
  status: CONTAINER_STATUS.RUNNING,
  source: { $type: CONTAINER_SOURCE_TYPE.HUGGINGFACE },
  metadata: { envs: [] },
  inferenceTask,
});

const renderWrapper = (
  inferenceTask: INFERENCE_TASK | undefined,
  overrides = {},
  route = ApplicationRoute.ModelServings,
) => {
  const createEntity = vi.fn();
  const createToolset = vi.fn();
  render(
    <ContainersButtonsWrapper
      route={route}
      container={baseContainer(inferenceTask)}
      isChanged={false}
      isRedeployRequired={false}
      jsonConfiguration={{ isEditorEnabled: false, onToggleEditor: vi.fn(), hideJsonEditorButton: false }}
      onDiscard={vi.fn()}
      onSave={vi.fn()}
      createEntity={createEntity}
      createToolset={createToolset}
      entityNames={[]}
      toolsetNames={[]}
      {...overrides}
    />,
  );
  return { createEntity, createToolset };
};

const createButton = () => screen.queryByRole('button', { name: CreateI18nKey.CreateEntity });
const adminOption = (entity: string) => screen.getByRole('button', { name: entity });

const setAdminApiEnabled = (isEnabled: boolean) => {
  useAppContext().featureFlags.adminApiEnabled = isEnabled;
};

afterEach(() => setAdminApiEnabled(true));

describe('ContainersButtonsWrapper capability branching', () => {
  test('TEXT_GENERATION opens the Models create flow with createEntity', async () => {
    const user = userEvent.setup();
    const { createEntity, createToolset } = renderWrapper(INFERENCE_TASK.TEXT_GENERATION);

    await user.click(adminOption(EntitiesI18nKey.Model));

    expect(screen.getByText(`modal-route:${ApplicationRoute.Models}`)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'invoke-create' }));
    expect(createEntity).toHaveBeenCalled();
    expect(createToolset).not.toHaveBeenCalled();
  });

  test('TEXT_CLASSIFICATION opens the Toolsets create flow with createToolset', async () => {
    const user = userEvent.setup();
    const { createEntity, createToolset } = renderWrapper(INFERENCE_TASK.TEXT_CLASSIFICATION);

    await user.click(adminOption(EntitiesI18nKey.Toolset));

    expect(screen.getByText(`modal-route:${ApplicationRoute.Toolsets}`)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'invoke-create' }));
    expect(createToolset).toHaveBeenCalled();
    expect(createEntity).not.toHaveBeenCalled();
  });

  test('NONE shows no create action', () => {
    renderWrapper(INFERENCE_TASK.NONE);
    expect(screen.queryByText(ButtonsI18nKey.Create)).not.toBeInTheDocument();
    expect(createButton()).not.toBeInTheDocument();
  });

  test('marks the create flow as a modal so view-only fields such as Intro stay out of the popup', async () => {
    const user = userEvent.setup();
    renderWrapper(INFERENCE_TASK.TEXT_GENERATION);

    await user.click(adminOption(EntitiesI18nKey.Model));

    expect(screen.getByText('modal-is-modal:true')).toBeInTheDocument();
  });

  test('absent inferenceTask keeps the model create flow', async () => {
    const user = userEvent.setup();
    const { createEntity } = renderWrapper(undefined);

    await user.click(adminOption(EntitiesI18nKey.Model));
    expect(screen.getByText(`modal-route:${ApplicationRoute.Models}`)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'invoke-create' }));
    expect(createEntity).toHaveBeenCalled();
  });
});

describe('ContainersButtonsWrapper Core asset option', () => {
  test('offers the admin-backend entity and the Core asset side by side with the admin API', async () => {
    const user = userEvent.setup();
    renderWrapper(undefined, { assetNames: ['in-platform', 'in-config-file'] }, ApplicationRoute.InterceptorContainers);

    expect(screen.getByText(ButtonsI18nKey.Create)).toBeInTheDocument();
    expect(adminOption(EntitiesI18nKey.Interceptor)).toBeInTheDocument();
    await user.click(adminOption(EntitiesI18nKey.AssetInterceptor));

    // A flat platform type opens the same create flow as its Assets list, with Core's names.
    expect(screen.getByText(`modal-route:${ApplicationRoute.PlatformInterceptors}`)).toBeInTheDocument();
    expect(screen.getByText('modal-names:in-platform,in-config-file')).toBeInTheDocument();
  });

  test('opens the folder-aware asset modal on the platform bucket for an application container', async () => {
    const user = userEvent.setup();
    renderWrapper(undefined, {}, ApplicationRoute.ApplicationContainers);

    await user.click(adminOption(EntitiesI18nKey.AssetApplication));

    expect(screen.getByText(`asset-view:${ApplicationRoute.AssetsApplications}`)).toBeInTheDocument();
    expect(screen.getByText('asset-opens-on-platform:true')).toBeInTheDocument();
  });

  test('labels the adapter container asset option as a model', () => {
    renderWrapper(undefined, {}, ApplicationRoute.AdapterContainers);

    expect(adminOption(EntitiesI18nKey.Adapter)).toBeInTheDocument();
    expect(adminOption(EntitiesI18nKey.AssetModel)).toBeInTheDocument();
  });

  test('collapses to one Core create button without the admin API', async () => {
    const user = userEvent.setup();
    setAdminApiEnabled(false);
    renderWrapper(undefined, { createEntity: undefined }, ApplicationRoute.AdapterContainers);

    expect(screen.queryByText(ButtonsI18nKey.Create)).not.toBeInTheDocument();
    await user.click(createButton()!);

    expect(screen.getByText(`modal-route:${ApplicationRoute.PlatformModels}`)).toBeInTheDocument();
  });

  test('creates a Core toolset from a text-classification serving without the admin API', async () => {
    const user = userEvent.setup();
    setAdminApiEnabled(false);
    renderWrapper(INFERENCE_TASK.TEXT_CLASSIFICATION, { createEntity: undefined, createToolset: undefined });

    await user.click(createButton()!);

    expect(screen.getByText(`asset-view:${ApplicationRoute.AssetsToolsets}`)).toBeInTheDocument();
  });

  test('shows no Core create button for a stopped container', () => {
    setAdminApiEnabled(false);
    render(
      <ContainersButtonsWrapper
        route={ApplicationRoute.McpContainers}
        container={{ ...baseContainer(), status: CONTAINER_STATUS.STOPPED }}
        isChanged={false}
        isRedeployRequired={false}
        jsonConfiguration={{ isEditorEnabled: false, onToggleEditor: vi.fn(), hideJsonEditorButton: false }}
        onDiscard={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(createButton()).not.toBeInTheDocument();
  });
});
