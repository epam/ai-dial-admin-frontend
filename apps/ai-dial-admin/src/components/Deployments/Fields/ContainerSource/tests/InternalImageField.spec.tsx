import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import InternalImageField from '@/src/components/Deployments/Fields/ContainerSource/InternalImageField';
import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { CONTAINER_SOURCE_TYPE, CONTAINER_STATUS, CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';

const refreshMock = vi.fn();
const showNotificationMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock, push: vi.fn() }),
}));

vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: showNotificationMock }),
}));

const updateContainerMock = vi.fn();
vi.mock('@/src/app/actions/deployments', () => ({
  updateContainer: (c: Container) => updateContainerMock(c),
}));

vi.mock('@/src/components/Deployments/Modals/ContainerChangeImage', () => ({
  default: ({ onApply, onClose }: { onApply: (id: string) => void; onClose: () => void }) => (
    <div role="dialog" aria-label="change-image-modal">
      <button type="button" onClick={() => onApply('new-image-id')}>
        Apply
      </button>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

const baseContainer = (status: CONTAINER_STATUS = CONTAINER_STATUS.RUNNING): Container => ({
  $type: CONTAINER_TYPE.MCP,
  name: 'test-container',
  status,
  source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: 'img-1' },
  metadata: { envs: [] },
});

const sampleImage = {
  id: 'img-1',
  name: 'Github',
  version: '1.2.1',
} as Image;

// DialInputPopup renders a <button aria-label="open-popup"> that toggles the popup.
const getPopupTrigger = () => screen.getByRole('button', { name: /open-popup/i });

describe('InternalImageField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders image name and version as the selected value', () => {
    render(
      <InternalImageField container={baseContainer()} image={sampleImage} route={ApplicationRoute.McpContainers} />,
    );
    expect(screen.getByText('Github (1.2.1)')).toBeInTheDocument();
  });

  test('renders the field label using ContainersI18nKey.ContainerImage', () => {
    render(
      <InternalImageField container={baseContainer()} image={sampleImage} route={ApplicationRoute.McpContainers} />,
    );
    expect(screen.getByText(/Containers\.ContainerImage/)).toBeInTheDocument();
  });

  test('clicking the input popup trigger opens the ContainerChangeImage modal', () => {
    render(
      <InternalImageField container={baseContainer()} image={sampleImage} route={ApplicationRoute.McpContainers} />,
    );
    expect(screen.queryByRole('dialog', { name: 'change-image-modal' })).toBeNull();
    fireEvent.click(getPopupTrigger());
    expect(screen.getByRole('dialog', { name: 'change-image-modal' })).toBeInTheDocument();
  });

  test('clicking while image is undefined does not open the modal', () => {
    render(<InternalImageField container={baseContainer()} route={ApplicationRoute.McpContainers} />);
    fireEvent.click(getPopupTrigger());
    expect(screen.queryByRole('dialog', { name: 'change-image-modal' })).toBeNull();
  });

  test('clicking while disabled prop is true does not open the modal', () => {
    render(
      <InternalImageField
        container={baseContainer()}
        image={sampleImage}
        route={ApplicationRoute.McpContainers}
        disabled
      />,
    );
    fireEvent.click(getPopupTrigger());
    expect(screen.queryByRole('dialog', { name: 'change-image-modal' })).toBeNull();
  });

  test('applying a new id calls updateContainer with spread source and refreshes router', async () => {
    updateContainerMock.mockResolvedValue({ success: true });
    render(
      <InternalImageField container={baseContainer()} image={sampleImage} route={ApplicationRoute.McpContainers} />,
    );
    fireEvent.click(getPopupTrigger());
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(updateContainerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          source: { $type: CONTAINER_SOURCE_TYPE.INTERNAL_IMAGE, imageDefinitionId: 'new-image-id' },
        }),
      );
    });
    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  test('apply failure shows an error notification and does not refresh', async () => {
    updateContainerMock.mockResolvedValue({
      success: false,
      errorHeader: 'Error',
      errorMessage: 'boom',
      requestId: 'req-1',
    });
    render(
      <InternalImageField container={baseContainer()} image={sampleImage} route={ApplicationRoute.McpContainers} />,
    );
    fireEvent.click(getPopupTrigger());
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(showNotificationMock).toHaveBeenCalled();
    });
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
