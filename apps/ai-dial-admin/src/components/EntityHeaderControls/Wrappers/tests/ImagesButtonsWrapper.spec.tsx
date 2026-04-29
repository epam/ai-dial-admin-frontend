import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, ImagesI18nKey } from '@/src/constants/i18n';
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
    // Name changed → fork button is labeled "Save as new image"
    expect(screen.getByRole('button', { name: ButtonsI18nKey.SaveAsNewImage })).toBeInTheDocument();
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

  test('name changed + dirty: fork button reads "Save as new image"', () => {
    const originalImage = buildImage({ buildStatus: IMAGE_STATUS.NOT_BUILT });
    const edited = { ...originalImage, name: 'fresh-name' };

    render(<ImagesButtonsWrapper {...baseProps} image={edited} originalImage={originalImage} isChanged />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.SaveAsNewImage })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: saveAsNewVersionButtonName })).not.toBeInTheDocument();
  });

  test('name unchanged + dirty: fork button stays "Save as new version" (regression)', () => {
    const originalImage = buildImage({ buildStatus: IMAGE_STATUS.NOT_BUILT });
    const edited = { ...originalImage, description: 'edited' };

    render(<ImagesButtonsWrapper {...baseProps} image={edited} originalImage={originalImage} isChanged />);

    expect(screen.getByRole('button', { name: saveAsNewVersionButtonName })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.SaveAsNewImage })).not.toBeInTheDocument();
  });

  test('name changed + click fork button: modal opens with "Save new image" header and version 1.0.0', () => {
    const originalImage = buildImage({ buildStatus: IMAGE_STATUS.NOT_BUILT, name: 'my-image', version: '1.0.0' });
    const edited = { ...originalImage, name: 'brand-new-name' };
    // versions list reflects the typed name (after verifyVersion debounce).
    // brand-new-name has no versions → defaultVersion='1.0.0' should kick in.
    const versions: ImageVersion[] = [];

    render(
      <ImagesButtonsWrapper
        {...baseProps}
        versions={versions}
        image={edited}
        originalImage={originalImage}
        isChanged
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.SaveAsNewImage }));

    expect(screen.getByText(ImagesI18nKey.SaveNewImageModalTitle)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('1.0.0');
  });

  test('name unchanged + click fork button: modal opens with "Save new version" header and patch-bumped version', () => {
    const originalImage = buildImage({ buildStatus: IMAGE_STATUS.NOT_BUILT, name: 'my-image', version: '1.0.0' });
    const edited = { ...originalImage, description: 'edited' };
    // Versions for the original name → patch-bump default = 1.2.1
    const versions: ImageVersion[] = [{ id: 'id-x', name: 'my-image', status: IMAGE_STATUS.BUILT, version: '1.2.0' }];

    render(
      <ImagesButtonsWrapper
        {...baseProps}
        versions={versions}
        image={edited}
        originalImage={originalImage}
        isChanged
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: saveAsNewVersionButtonName }));

    expect(screen.getByText(ImagesI18nKey.SaveNewVersionModalTitle)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('1.2.1');
  });
});
