import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import ContainersButtonsWrapper from '@/src/components/EntityHeaderControls/Wrappers/ContainersButtonsWrapper';
import { CreateI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import { CONTAINER_STATUS, CONTAINER_TYPE, INFERENCE_TASK } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({ useIsReadOnlyAdmin: () => false }));
vi.mock('@/src/hooks/use-is-mobile-screen', () => ({ useIsMobileScreen: () => false }));
vi.mock('@/src/hooks/use-is-tablet-screen', () => ({ useIsOnlyTabletScreen: () => false }));

// Heavy children — assert on the wrapper's wiring, not their internals.
vi.mock('@/src/components/EntityListView/CreateEntity/CreateEntity', () => ({
  default: ({ route, createEntity }: any) => (
    <div>
      <span>modal-route:{route}</span>
      <button onClick={() => createEntity({ name: 'x' })}>invoke-create</button>
    </div>
  ),
}));
vi.mock('@/src/components/Assets/Deployments/CreateAsset', () => ({ default: () => null }));
vi.mock('@/src/components/EntityView/Modals/Delete/Delete', () => ({ default: () => null }));

const baseContainer = (inferenceTask?: INFERENCE_TASK): Container =>
  ({
    name: 'serving-1',
    displayName: 'Serving 1',
    $type: CONTAINER_TYPE.HF,
    status: CONTAINER_STATUS.RUNNING,
    metadata: { envs: [] },
    inferenceTask,
  }) as Container;

const renderWrapper = (inferenceTask: INFERENCE_TASK | undefined, overrides = {}) => {
  const createEntity = vi.fn();
  const createToolset = vi.fn();
  render(
    <ContainersButtonsWrapper
      route={ApplicationRoute.ModelServings}
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

describe('ContainersButtonsWrapper capability branching', () => {
  test('TEXT_GENERATION opens the Models create flow with createEntity', async () => {
    const user = userEvent.setup();
    const { createEntity, createToolset } = renderWrapper(INFERENCE_TASK.TEXT_GENERATION);

    const button = createButton();
    expect(button).toBeInTheDocument();
    await user.click(button!);

    expect(screen.getByText(`modal-route:${ApplicationRoute.Models}`)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'invoke-create' }));
    expect(createEntity).toHaveBeenCalled();
    expect(createToolset).not.toHaveBeenCalled();
  });

  test('TEXT_CLASSIFICATION opens the Toolsets create flow with createToolset', async () => {
    const user = userEvent.setup();
    const { createEntity, createToolset } = renderWrapper(INFERENCE_TASK.TEXT_CLASSIFICATION);

    const button = createButton();
    expect(button).toBeInTheDocument();
    await user.click(button!);

    expect(screen.getByText(`modal-route:${ApplicationRoute.Toolsets}`)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'invoke-create' }));
    expect(createToolset).toHaveBeenCalled();
    expect(createEntity).not.toHaveBeenCalled();
  });

  test('NONE shows no create button', () => {
    renderWrapper(INFERENCE_TASK.NONE);
    expect(createButton()).not.toBeInTheDocument();
  });

  test('absent inferenceTask keeps the model create flow', async () => {
    const user = userEvent.setup();
    const { createEntity } = renderWrapper(undefined);

    const button = createButton();
    expect(button).toBeInTheDocument();
    await user.click(button!);
    expect(screen.getByText(`modal-route:${ApplicationRoute.Models}`)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'invoke-create' }));
    expect(createEntity).toHaveBeenCalled();
  });
});
