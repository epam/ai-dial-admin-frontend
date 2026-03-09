import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { IMAGE_TYPE } from '@/src/types/deployments/images';
import type { Image } from '@/src/models/deployments/images';

let capturedSize: string | undefined;

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialConfirmationPopup: ({ header, size, children, open }: any) => {
    capturedSize = size;
    return open ? (
      <div role="dialog" aria-label={header}>
        {children}
      </div>
    ) : null;
  },
  PopupSize: { Sm: 'sm', Md: 'md', Lg: 'lg' },
}));

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ resourcesDefaults: {} }),
}));

vi.mock('@/src/context/SaveValidationContext', () => ({
  useSaveValidationContext: () => ({ isValid: true }),
}));

vi.mock('@/src/locales/client', () => ({
  useI18n: () => (key: string) => key,
}));

vi.mock('@/src/utils/deployments/containers', () => ({
  getContainerTemplate: () => ({}),
}));

vi.mock('@/src/utils/deployments/entity', () => ({
  getRouteByType: () => 'mcp-containers',
}));

vi.mock('@/src/utils/deployments/images', () => ({
  getContainerTypeByImageType: () => 'mcp',
}));

vi.mock('@/src/components/Containers/Fields/ContainerFields', () => ({
  __esModule: true,
  default: () => <div>fields</div>,
}));

import ImageCreateContainer from '../ImageCreateContainer';

const makeImage = (): Image =>
  ({
    $type: IMAGE_TYPE.MCP,
    id: 'test-image',
    buildStatus: 'ready',
    version: '1.0',
    source: { $type: 'git', url: 'https://example.com' },
    name: 'test',
  }) as unknown as Image;

describe('ImageCreateContainer', () => {
  test('renders popup with medium size', () => {
    render(
      <ImageCreateContainer
        isModalOpen={true}
        modalTitle="Create Container"
        onClose={vi.fn()}
        onCreate={vi.fn()}
        image={makeImage()}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Create Container' })).toBeInTheDocument();
    expect(capturedSize).toBe('md');
  });
});
