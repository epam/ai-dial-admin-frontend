import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Image } from '@/src/models/deployments/images';
import { IMAGE_SOURCE_TYPE, IMAGE_STATUS, IMAGE_TYPE } from '@/src/types/deployments/images';
import ImageSource from '@/src/components/Deployments/Fields/ImageSource';

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
        externalRegistryRef: { $type: 'mcp-registry', packageName: 'io.github.user/server' },
      },
    };

    render(<ImageSource image={image} setImage={vi.fn()} verifyVersion={vi.fn()} />);

    expect(screen.getByText('McpServerNameField')).toBeTruthy();
    expect(screen.getByText('EntityFields.BranchName')).toBeTruthy();
  });

  test('does not render CodeURL when externalRegistryRef exists', () => {
    const image: Image = {
      ...baseImage,
      source: {
        $type: IMAGE_SOURCE_TYPE.CODE,
        url: 'https://github.com/user/repo',
        externalRegistryRef: { $type: 'mcp-registry', packageName: 'io.github.user/server' },
      },
    };

    render(<ImageSource image={image} setImage={vi.fn()} verifyVersion={vi.fn()} />);

    expect(screen.queryByText('EntityFields.SourceURL')).toBeNull();
  });
});
