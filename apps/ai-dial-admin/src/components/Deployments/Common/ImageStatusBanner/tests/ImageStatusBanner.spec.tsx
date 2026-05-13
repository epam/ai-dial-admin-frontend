import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ImageStatusBanner from '@/src/components/Deployments/Common/ImageStatusBanner/ImageStatusBanner';
import { ContainersI18nKey } from '@/src/constants/i18n';
import { Image } from '@/src/models/deployments/images';
import {
  IMAGE_BUILDER_TYPE,
  IMAGE_SOURCE_TYPE,
  IMAGE_STATUS,
  IMAGE_TRANSPORT_TYPE,
  IMAGE_TYPE,
} from '@/src/types/deployments/images';

const installImageMock = vi.fn();
vi.mock('@/src/app/actions/deployments', () => ({
  installImage: (...args: unknown[]) => installImageMock(...args),
}));

const isReadOnlyAdminMock = vi.fn(() => false);
vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: () => isReadOnlyAdminMock(),
}));

const buildImage = (overrides: Partial<Image> = {}): Image => ({
  id: 'img-1',
  $type: IMAGE_TYPE.MCP,
  name: 'foo',
  version: '1.0.0',
  buildStatus: IMAGE_STATUS.NOT_BUILT,
  source: { $type: IMAGE_SOURCE_TYPE.DOCKER, imageUri: 'image:tag' },
  transportType: IMAGE_TRANSPORT_TYPE.LOCAL,
  imageBuilder: IMAGE_BUILDER_TYPE.ROOTLESS,
  topics: [],
  ...overrides,
});

describe('ImageStatusBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isReadOnlyAdminMock.mockReturnValue(false);
  });

  test('renders nothing when image is undefined', () => {
    const { container } = render(<ImageStatusBanner image={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing when buildStatus is BUILT', () => {
    const { container } = render(<ImageStatusBanner image={buildImage({ buildStatus: IMAGE_STATUS.BUILT })} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing when buildStatus is BUILDING', () => {
    const { container } = render(<ImageStatusBanner image={buildImage({ buildStatus: IMAGE_STATUS.BUILDING })} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders the banner with the not-installed message when buildStatus is NOT_BUILT', () => {
    render(<ImageStatusBanner image={buildImage({ buildStatus: IMAGE_STATUS.NOT_BUILT })} />);
    expect(screen.getByText(ContainersI18nKey.ImageNotInstalledWarning)).toBeInTheDocument();
    expect(screen.queryByText(ContainersI18nKey.ImageBuildFailedWarning)).not.toBeInTheDocument();
  });

  test('renders the banner with the build-failed message when buildStatus is BUILD_FAILED', () => {
    render(<ImageStatusBanner image={buildImage({ buildStatus: IMAGE_STATUS.BUILD_FAILED })} />);
    expect(screen.getByText(ContainersI18nKey.ImageBuildFailedWarning)).toBeInTheDocument();
    expect(screen.queryByText(ContainersI18nKey.ImageNotInstalledWarning)).not.toBeInTheDocument();
  });

  test('hides the install button when useIsReadOnlyAdmin returns true', () => {
    isReadOnlyAdminMock.mockReturnValue(true);
    render(<ImageStatusBanner image={buildImage()} />);
    expect(screen.queryByText(ContainersI18nKey.InstallImage)).not.toBeInTheDocument();
  });

  test('shows the install button when useIsReadOnlyAdmin returns false', () => {
    render(<ImageStatusBanner image={buildImage()} />);
    expect(screen.getByText(ContainersI18nKey.InstallImage)).toBeInTheDocument();
  });

  test('clicking the install button opens the ImageInstall confirmation modal', () => {
    render(<ImageStatusBanner image={buildImage()} />);
    fireEvent.click(screen.getByText(ContainersI18nKey.InstallImage));
    expect(screen.getByText(ContainersI18nKey.ContainerImage)).toBeInTheDocument();
  });
});
