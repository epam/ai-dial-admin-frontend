import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ContainerTypeModal from '../ContainerTypeModal';
import { ContainerCreateSource } from '@/src/components/Containers/List/models';
import { ButtonsI18nKey, ContainersI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { CONTAINER_TYPE } from '@/src/types/deployments/containers';

const { mockFeatureFlags } = vi.hoisted(() => ({ mockFeatureFlags: { mcpRegistryEnabled: true } }));

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ featureFlags: mockFeatureFlags }),
}));

describe('ContainerTypeModal', () => {
  const onClose = vi.fn();
  const onContinue = vi.fn();

  const renderModal = () => render(<ContainerTypeModal isModalOpen onClose={onClose} onContinue={onContinue} />);

  beforeEach(() => {
    vi.clearAllMocks();
    mockFeatureFlags.mcpRegistryEnabled = true;
  });

  test('lists the four container types and no source options before a type is picked', () => {
    renderModal();

    [EntitiesI18nKey.Adapter, EntitiesI18nKey.Application, EntitiesI18nKey.Interceptor, EntitiesI18nKey.MCP].forEach(
      (key) => expect(screen.getByRole('radio', { name: key })).toBeInTheDocument(),
    );
    expect(screen.queryByText(ContainersI18nKey.ContainerSourceField)).not.toBeInTheDocument();
  });

  test('disables the continue button until both a type and a source are chosen', async () => {
    const user = userEvent.setup();
    renderModal();

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Next })).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: EntitiesI18nKey.Adapter }));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Next })).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: ContainersI18nKey.FromDockerImageReference }));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Next })).toBeEnabled();
  });

  test('offers the MCP registry source only for MCP when the feature is enabled', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('radio', { name: EntitiesI18nKey.MCP }));
    expect(screen.getByRole('radio', { name: ContainersI18nKey.FromInternalMcpImage })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: ContainersI18nKey.FromMcpRegistry })).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: EntitiesI18nKey.Interceptor }));
    expect(screen.getByRole('radio', { name: ContainersI18nKey.FromInternalInterceptorImage })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: ContainersI18nKey.FromMcpRegistry })).not.toBeInTheDocument();
  });

  test('hides the MCP registry source when the feature is disabled', async () => {
    mockFeatureFlags.mcpRegistryEnabled = false;
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('radio', { name: EntitiesI18nKey.MCP }));

    expect(screen.queryByRole('radio', { name: ContainersI18nKey.FromMcpRegistry })).not.toBeInTheDocument();
  });

  test('clears the chosen source when the type changes', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('radio', { name: EntitiesI18nKey.Adapter }));
    await user.click(screen.getByRole('radio', { name: ContainersI18nKey.FromDockerImageReference }));
    await user.click(screen.getByRole('radio', { name: EntitiesI18nKey.Application }));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Next })).toBeDisabled();
  });

  test('reports the chosen type and source on continue', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('radio', { name: EntitiesI18nKey.Application }));
    await user.click(screen.getByRole('radio', { name: ContainersI18nKey.FromInternalApplicationImage }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));

    expect(onContinue).toHaveBeenCalledWith(CONTAINER_TYPE.APPLICATION, ContainerCreateSource.INTERNAL_IMAGE);
  });

  test('closes through the cancel button', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onClose).toHaveBeenCalled();
  });
});
