import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import McpServerDetails from '../McpServerDetails';
import { McpServer } from '@/src/types/deployments/mcp-registry';

vi.mock('@monaco-editor/react', () => ({
  Editor: ({ value, language }: { value: string; language: string }) => <pre data-language={language}>{value}</pre>,
}));

vi.mock('@/src/components/Common/FullscreenViewer/FullscreenViewer', () => ({
  default: () => null,
}));

const baseServer: McpServer & { updatedAt?: string } = {
  name: 'ai.aliengiraffe/spotdb',
  description: 'Manage your projects and debug deployments.',
  version: 'v0.1.0',
  updatedAt: '2024-10-12T14:30:00Z',
  repository: { url: 'https://github.com/example/spotdb', source: 'github' },
  websiteUrl: 'https://auteng.ai',
  remotes: [{ type: 'streamable-http', url: 'https://example.com/mcp' }],
};

describe('McpServerDetails', () => {
  test('renders nothing when isOpen is false', () => {
    const { container } = render(
      <McpServerDetails server={baseServer} isLoading={false} isOpen={false} onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('renders name, description, version, and last update from server', () => {
    render(<McpServerDetails server={baseServer} isLoading={false} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 3, name: baseServer.name })).toBeInTheDocument();
    expect(screen.getByText(baseServer.description)).toBeInTheDocument();
    expect(screen.getByText('v0.1.0')).toBeInTheDocument();
  });

  test('renders repository link when url is valid', () => {
    render(<McpServerDetails server={baseServer} isLoading={false} isOpen={true} onClose={vi.fn()} />);
    const repoLink = screen.getByRole('link', { name: /github\.com\/example\/spotdb/ });
    expect(repoLink).toHaveAttribute('href', 'https://github.com/example/spotdb');
    expect(repoLink).toHaveAttribute('target', '_blank');
  });

  test('renders JSON content with full serverResponse when provided', () => {
    const serverResponse = { server: baseServer, _meta: { published: true } };
    render(
      <McpServerDetails
        server={baseServer}
        serverResponse={serverResponse}
        isLoading={false}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText('Containers.ViewFullServerJson'));
    expect(screen.getByText(/"published"/)).toBeInTheDocument();
  });

  test('falls back to { server } in JSON when serverResponse is missing', () => {
    render(<McpServerDetails server={baseServer} isLoading={false} isOpen={true} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Containers.ViewFullServerJson'));
    expect(screen.getByText(/"ai\.aliengiraffe\/spotdb"/)).toBeInTheDocument();
  });

  test('SidePanel close callback propagates to onClose prop', () => {
    const onClose = vi.fn();
    render(<McpServerDetails server={baseServer} isLoading={false} isOpen={true} onClose={onClose} />);
    // The first button rendered is the SidePanel close button
    const closeButton = screen.getAllByRole('button')[0];
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
