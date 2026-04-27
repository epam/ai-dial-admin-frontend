import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { IMAGE_SOURCE_TYPE, IMAGE_STATUS, IMAGE_TRANSPORT_TYPE, IMAGE_TYPE } from '@/src/types/deployments/images';

import ImagesButtonsWrapper from '@/src/components/EntityHeaderControls/Wrappers/ImagesButtonsWrapper';

const buildImage = (overrides: Partial<Image> = {}): Image => ({
  id: 'id-1',
  $type: IMAGE_TYPE.MCP,
  buildStatus: IMAGE_STATUS.BUILT,
  name: 'my-image',
  version: '1.0.0',
  description: 'original description',
  source: { $type: IMAGE_SOURCE_TYPE.DOCKER, imageUri: 'img:1' },
  transportType: IMAGE_TRANSPORT_TYPE.LOCAL,
  ...overrides,
});

const buildVersions = (): ImageVersion[] => [
  { id: 'id-1', name: 'my-image', status: IMAGE_STATUS.BUILT, version: '1.0.0' },
];

const baseProps = {
  versions: buildVersions(),
  onDiscard: vi.fn(),
  onSave: vi.fn(),
};

const saveButtonName = ButtonsI18nKey.Save;
const saveAsNewVersionButtonName = ButtonsI18nKey.SaveAsNewVersion;

describe('ImagesButtonsWrapper', () => {
  test('BUILT + metadata-only change + dirty: renders both Save and Save as new version', () => {
    const originalImage = buildImage({ buildStatus: IMAGE_STATUS.BUILT });
    const edited = { ...originalImage, description: 'edited' };

    render(<ImagesButtonsWrapper {...baseProps} image={edited} originalImage={originalImage} isChanged />);

    expect(screen.getByRole('button', { name: saveButtonName })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: saveAsNewVersionButtonName })).toBeInTheDocument();
  });

  test('BUILT + build-affecting change + dirty: renders Save as new version only (no Save)', () => {
    const originalImage = buildImage({ buildStatus: IMAGE_STATUS.BUILT });
    const edited = { ...originalImage, transportType: IMAGE_TRANSPORT_TYPE.REMOTE };

    render(<ImagesButtonsWrapper {...baseProps} image={edited} originalImage={originalImage} isChanged />);

    expect(screen.queryByRole('button', { name: saveButtonName })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: saveAsNewVersionButtonName })).toBeInTheDocument();
  });

  test('BUILT + metadata change + forceNewVersion active: Save stays hidden', () => {
    const versions = [
      { id: 'id-1', name: 'my-image', status: IMAGE_STATUS.BUILT, version: '1.0.0' },
      { id: 'id-2', name: 'my-image', status: IMAGE_STATUS.BUILT, version: '2.0.0' },
    ];
    const originalImage = buildImage({ buildStatus: IMAGE_STATUS.BUILT, name: 'my-image' });
    // name changed AND new version collides with an existing version → forceNewVersion=true
    const edited = { ...originalImage, name: 'renamed', version: '2.0.0', description: 'edited' };

    render(
      <ImagesButtonsWrapper
        {...baseProps}
        versions={versions}
        image={edited}
        originalImage={originalImage}
        isChanged
      />,
    );

    expect(screen.queryByRole('button', { name: saveButtonName })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: saveAsNewVersionButtonName })).toBeInTheDocument();
  });

  test('BUILDING + metadata-only change + dirty: renders Save as new version only', () => {
    const originalImage = buildImage({ buildStatus: IMAGE_STATUS.BUILDING });
    const edited = { ...originalImage, description: 'edited' };

    render(<ImagesButtonsWrapper {...baseProps} image={edited} originalImage={originalImage} isChanged />);

    expect(screen.queryByRole('button', { name: saveButtonName })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: saveAsNewVersionButtonName })).toBeInTheDocument();
  });

  test('NOT_BUILT + build-affecting change + dirty: renders both Save and Save as new version', () => {
    const originalImage = buildImage({ buildStatus: IMAGE_STATUS.NOT_BUILT });
    const edited = { ...originalImage, transportType: IMAGE_TRANSPORT_TYPE.REMOTE };

    render(<ImagesButtonsWrapper {...baseProps} image={edited} originalImage={originalImage} isChanged />);

    expect(screen.getByRole('button', { name: saveButtonName })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: saveAsNewVersionButtonName })).toBeInTheDocument();
  });
});
