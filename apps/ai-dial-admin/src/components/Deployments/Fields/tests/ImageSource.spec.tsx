import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Image } from '@/src/models/deployments/images';
import { IMAGE_SOURCE_TYPE, IMAGE_STATUS, IMAGE_TYPE } from '@/src/types/deployments/images';
import ImageSource from '@/src/components/Deployments/Fields/ImageSource';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';

vi.mock('@/src/components/Deployments/Fields/ContainerSource/McpServerNameField', () => ({
  default: () => <div>McpServerNameField</div>,
}));

describe('ImageSource', () => {
  const baseImage: Image = {
    id: 'test-image',
    $type: IMAGE_TYPE.MCP,
    name: 'test-image',
    version: '1.0.0',
    description: '',
    buildStatus: IMAGE_STATUS.NOT_BUILT,
    source: { $type: IMAGE_SOURCE_TYPE.CODE, url: '' },
  };

  test('renders for CODE source', () => {
    render(<ImageSource image={baseImage} setImage={vi.fn()} verifyVersion={vi.fn()} />);

    expect(screen.getByText('EntityFields.SourceURL')).toBeTruthy();
  });

  test('renders McpServerNameField when externalRegistryRef exists', () => {
    const image: Image = {
      ...baseImage,
      source: {
        $type: IMAGE_SOURCE_TYPE.CODE,
        url: 'https://github.com/user/repo',
        externalRegistryRef: { $type: SOURCE_TYPE.MCP_REGISTRY, packageName: 'io.github.user/server' },
      },
    };

    render(<ImageSource image={image} setImage={vi.fn()} verifyVersion={vi.fn()} />);

    expect(screen.getByText('McpServerNameField')).toBeTruthy();
    expect(screen.getByText('EntityFields.BranchName')).toBeTruthy();
  });

  test('renders CodeURL disabled when externalRegistryRef exists in view', () => {
    const image: Image = {
      ...baseImage,
      source: {
        $type: IMAGE_SOURCE_TYPE.CODE,
        url: 'https://github.com/user/repo',
        externalRegistryRef: { $type: SOURCE_TYPE.MCP_REGISTRY, packageName: 'io.github.user/server' },
      },
    };

    render(<ImageSource image={image} setImage={vi.fn()} verifyVersion={vi.fn()} />);

    expect(screen.getByText('EntityFields.SourceURL')).toBeTruthy();
    expect(screen.getByDisplayValue('https://github.com/user/repo')).toBeDisabled();
  });

  test('does not render CodeURL when externalRegistryRef exists in modal', () => {
    const image: Image = {
      ...baseImage,
      source: {
        $type: IMAGE_SOURCE_TYPE.CODE,
        url: 'https://github.com/user/repo',
        externalRegistryRef: { $type: SOURCE_TYPE.MCP_REGISTRY, packageName: 'io.github.user/server' },
      },
    };

    render(<ImageSource image={image} setImage={vi.fn()} verifyVersion={vi.fn()} isModal />);

    expect(screen.queryByText('EntityFields.SourceURL')).toBeNull();
  });
});
