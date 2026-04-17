import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Image } from '@/src/models/deployments/images';
import { IMAGE_SOURCE_TYPE, IMAGE_STATUS, IMAGE_TYPE } from '@/src/types/deployments/images';
import ImageMcpRegistry from '@/src/components/Deployments/Fields/ImageSource/ImageMcpRegistry';

vi.mock('@/src/components/Deployments/Fields/ContainerSource/McpServerNameField', () => ({
  default: ({ serverName, onServerSelect }: { serverName: string; onServerSelect: (s: unknown) => void }) => (
    <div>
      <span>McpServerNameField</span>
      <span>{serverName}</span>
      <button
        onClick={() =>
          onServerSelect({
            name: 'org/server',
            version: '1.0.0',
            repository: { url: 'https://github.com/org/server', source: 'github' },
          })
        }
      >
        select-repo
      </button>
      <button
        onClick={() =>
          onServerSelect({
            name: 'org/oci-only',
            version: '2.0.0',
            packages: [{ registryType: 'oci', identifier: 'docker.io/org/img:2.0', transport: { type: 'stdio' } }],
          })
        }
      >
        select-oci
      </button>
    </div>
  ),
}));

vi.mock('@/src/app/actions/deployments', () => ({
  getImageMcpServers: vi.fn().mockResolvedValue({ success: true, response: { servers: [] } }),
}));

describe('ImageMcpRegistry', () => {
  const baseImage: Image = {
    id: 'test',
    $type: IMAGE_TYPE.MCP,
    name: 'test',
    version: '1.0.0',
    description: '',
    buildStatus: IMAGE_STATUS.NOT_BUILT,
    source: {
      $type: IMAGE_SOURCE_TYPE.CODE,
      url: '',
      externalRegistryRef: { $type: 'mcp-registry', packageName: 'org/server' },
    },
  };

  test('renders McpServerNameField with server name', () => {
    render(<ImageMcpRegistry image={baseImage} setImage={vi.fn()} onServerChange={vi.fn()} />);

    expect(screen.getByText('McpServerNameField')).toBeTruthy();
    expect(screen.getByText('org/server')).toBeTruthy();
  });

  test('selects server with repo — sets CODE source', () => {
    const setImage = vi.fn();
    const onServerChange = vi.fn();
    render(<ImageMcpRegistry image={baseImage} setImage={setImage} onServerChange={onServerChange} />);

    screen.getByText('select-repo').click();

    expect(onServerChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'org/server' }));
    expect(setImage).toHaveBeenCalledWith(
      expect.objectContaining({
        source: expect.objectContaining({
          $type: IMAGE_SOURCE_TYPE.CODE,
          url: 'https://github.com/org/server',
        }),
      }),
    );
  });

  test('selects OCI-only server — sets DOCKER source', () => {
    const setImage = vi.fn();
    const onServerChange = vi.fn();
    render(<ImageMcpRegistry image={baseImage} setImage={setImage} onServerChange={onServerChange} />);

    screen.getByText('select-oci').click();

    expect(onServerChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'org/oci-only' }));
    expect(setImage).toHaveBeenCalledWith(
      expect.objectContaining({
        source: expect.objectContaining({
          $type: IMAGE_SOURCE_TYPE.DOCKER,
          imageUri: 'docker.io/org/img:2.0',
        }),
      }),
    );
  });
});
