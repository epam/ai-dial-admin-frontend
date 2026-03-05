import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ImageBuildPrivileges from '@/src/components/Deployments/Fields/ImageBuildPrivileges';
import { Image } from '@/src/models/deployments/images';
import { IMAGE_BUILDER_TYPE, IMAGE_SOURCE_TYPE, IMAGE_STATUS, IMAGE_TYPE } from '@/src/types/deployments/images';

const mockImage: Image = {
  id: 'test-id',
  $type: IMAGE_TYPE.MCP,
  version: '1.0.0',
  name: 'test-image',
  description: '',
  source: { $type: IMAGE_SOURCE_TYPE.DOCKER, imageUri: '' },
  imageBuilder: IMAGE_BUILDER_TYPE.ROOTLESS,
  buildStatus: IMAGE_STATUS.NOT_BUILT,
};

describe('ImageBuildPrivileges', () => {
  test('should render correctly', () => {
    render(<ImageBuildPrivileges image={mockImage} setImage={vi.fn()} />);

    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  test('should call setImage with buildkit when Root is selected', async () => {
    const setImage = vi.fn();
    const user = userEvent.setup();

    render(<ImageBuildPrivileges image={mockImage} setImage={setImage} />);

    const rootRadio = screen.getByLabelText('Images.BuilderRoot');
    await user.click(rootRadio);

    expect(setImage).toHaveBeenCalledWith({
      ...mockImage,
      imageBuilder: IMAGE_BUILDER_TYPE.ROOT,
    });
  });

  test('should call setImage with buildkit_rootless when Rootless is selected', async () => {
    const setImage = vi.fn();
    const user = userEvent.setup();
    const imageWithRoot = { ...mockImage, imageBuilder: IMAGE_BUILDER_TYPE.ROOT };

    render(<ImageBuildPrivileges image={imageWithRoot} setImage={setImage} />);

    const rootlessRadio = screen.getByLabelText('Images.BuilderRootless');
    await user.click(rootlessRadio);

    expect(setImage).toHaveBeenCalledWith({
      ...imageWithRoot,
      imageBuilder: IMAGE_BUILDER_TYPE.ROOTLESS,
    });
  });
});
