import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ImageFields from '@/src/components/Images/Fields/ImageFields';
import { Image } from '@/src/models/deployments/images';
import { IMAGE_BUILDER_TYPE, IMAGE_SOURCE_TYPE, IMAGE_STATUS, IMAGE_TYPE } from '@/src/types/deployments/images';

vi.mock('@/src/components/Deployments/Fields/ImageBase', () => ({
  default: () => <div>ImageBase</div>,
}));

vi.mock('@/src/components/Deployments/Fields/ImageSource', () => ({
  default: () => <div>ImageSource</div>,
}));

vi.mock('@/src/components/Deployments/Fields/ImageTransport', () => ({
  default: () => <div>ImageTransport</div>,
}));

vi.mock('@/src/components/Deployments/Fields/ImageBuildPrivileges', () => ({
  default: () => <div>ImageBuildPrivileges</div>,
}));

vi.mock('@/src/app/actions/deployments', () => ({
  getImageVersions: vi.fn(),
}));

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

describe('ImageFields', () => {
  test('should render correctly', () => {
    render(<ImageFields image={mockImage} setImage={vi.fn()} />);

    expect(screen.getByText('ImageBase')).toBeInTheDocument();
    expect(screen.getByText('ImageSource')).toBeInTheDocument();
  });

  test('should render ImageBuildPrivileges in the same group as ImageBase in Properties view', () => {
    render(<ImageFields image={mockImage} setImage={vi.fn()} />);

    const buildPrivileges = screen.getByText('ImageBuildPrivileges');
    expect(buildPrivileges).toBeInTheDocument();

    const baseEl = screen.getByText('ImageBase');
    const baseGroup = baseEl.closest('div')?.parentElement;
    const privilegesGroup = buildPrivileges.closest('div')?.parentElement;
    expect(baseGroup).toBe(privilegesGroup);
  });

  test('should not render ImageBuildPrivileges in modal', () => {
    render(<ImageFields image={mockImage} setImage={vi.fn()} isModal={true} />);

    expect(screen.queryByText('ImageBuildPrivileges')).not.toBeInTheDocument();
  });

  test('should render dividers between field groups', () => {
    const { container } = render(<ImageFields image={mockImage} setImage={vi.fn()} />);

    const parentDiv = container.firstChild as HTMLElement;
    expect(parentDiv.className).toContain('divide-y');
    expect(parentDiv.className).toContain('divide-primary');
  });
});
