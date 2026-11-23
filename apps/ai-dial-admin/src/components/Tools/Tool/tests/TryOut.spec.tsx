import { appContextMock } from '@/test-mocks/app-context';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TryOut from '../TryOut';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { ResourceType } from '@/src/types/resource-type';
import { ApplicationRoute } from '@/src/types/routes';
import userEvent from '@testing-library/user-event';

const mockTryOutContainerTool = vi.fn();
const mockTryOutTool = vi.fn();
const mockTryOutAssetTool = vi.fn();
const mockTryOutApplicationTool = vi.fn();

vi.mock('@/src/app/actions/deployments', () => ({
  tryOutContainerTool: (...args: unknown[]) => mockTryOutContainerTool(...args),
}));

vi.mock('@/src/app/[lang]/toolsets/actions', () => ({
  tryOutTool: (...args: unknown[]) => mockTryOutTool(...args),
}));

vi.mock('@/src/app/[lang]/assets-toolsets/actions', () => ({
  tryOutAssetTool: (...args: unknown[]) => mockTryOutAssetTool(...args),
}));

vi.mock('@/src/app/[lang]/applications/actions', () => ({
  tryOutTool: (...args: unknown[]) => mockTryOutApplicationTool(...args),
}));

beforeEach(() => {
  appContextMock.use(() => ({
    sidebar: {
      show: false,
      content: null,
      closeSidebar: vi.fn(),
      toggleIsMenuClosed: vi.fn(),
      isMenuClosed: false,
    },
    toggleSidebar: vi.fn(),
  }));
});

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: ({ entity }: { entity: unknown }) => <pre role="code">{JSON.stringify(entity)}</pre>,
}));

vi.mock('@/src/components/Common/SchemaUIRenderer/SchemaUIRenderer', () => ({
  default: () => <div data-testid="schema-renderer" />,
}));

const baseTool = {
  name: 'test-tool',
  description: 'A test tool',
  inputSchema: {
    type: 'object',
    properties: {
      input: { type: 'string' },
    },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TryOut - application', () => {
  test('calls the application action for a config application', async () => {
    const user = userEvent.setup();
    mockTryOutApplicationTool.mockResolvedValue({ success: true, response: { result: 'ok' } });
    render(<TryOut tool={baseTool as any} toolSetName="assistant" view={ApplicationRoute.Applications} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.SendRequest }));
    expect(await screen.findByText(/"result":"ok"/)).toBeInTheDocument();
    expect(mockTryOutApplicationTool).toHaveBeenCalledWith('assistant', { name: 'test-tool', arguments: {} });
    expect(mockTryOutContainerTool).not.toHaveBeenCalled();
  });

  test('calls the asset application action for a resource application', async () => {
    const user = userEvent.setup();
    mockTryOutAssetTool.mockResolvedValue({ success: true, response: { result: 'ok' } });
    render(
      <TryOut
        tool={baseTool as any}
        toolSetName="public/assistant"
        view={ApplicationRoute.AssetsApplications}
        isAssetToolset
      />,
    );

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.SendRequest }));
    expect(await screen.findByText(/"result":"ok"/)).toBeInTheDocument();
    expect(mockTryOutAssetTool).toHaveBeenCalledWith(
      { toolSetPath: { path: 'public/assistant' }, callToolRequest: { name: 'test-tool', arguments: {} } },
      ResourceType.APPLICATION,
    );
    expect(mockTryOutContainerTool).not.toHaveBeenCalled();
  });
});

describe('TryOut - MCP Container', () => {
  test('calls tryOutContainerTool when isMcpToolset and containerId are provided', async () => {
    mockTryOutContainerTool.mockResolvedValue({ success: true, response: { result: 'ok' } });

    render(<TryOut tool={baseTool as any} toolSetName="test-toolset" isMcpToolset containerId="container-123" />);

    const sendButton = screen.getByRole('button', { name: ButtonsI18nKey.SendRequest });
    fireEvent.click(sendButton);

    await vi.waitFor(() =>
      expect(mockTryOutContainerTool).toHaveBeenCalledWith('container-123', {
        name: 'test-tool',
        arguments: {},
      }),
    );

    expect(mockTryOutTool).not.toHaveBeenCalled();
  });

  test('calls tryOutTool when isMcpToolset is not set', async () => {
    mockTryOutTool.mockResolvedValue({ success: true, response: { result: 'ok' } });

    render(<TryOut tool={baseTool as any} toolSetName="test-toolset" />);

    const sendButton = screen.getByRole('button', { name: ButtonsI18nKey.SendRequest });
    fireEvent.click(sendButton);

    await vi.waitFor(() =>
      expect(mockTryOutTool).toHaveBeenCalledWith('test-toolset', {
        name: 'test-tool',
        arguments: {},
      }),
    );

    expect(mockTryOutContainerTool).not.toHaveBeenCalled();
  });

  test('displays error response from container tool call', async () => {
    mockTryOutContainerTool.mockResolvedValue({ success: false, errorMessage: 'Container is not running' });

    render(<TryOut tool={baseTool as any} toolSetName="test-toolset" isMcpToolset containerId="container-123" />);

    const sendButton = screen.getByRole('button', { name: ButtonsI18nKey.SendRequest });
    fireEvent.click(sendButton);

    await waitFor(() =>
      expect(screen.getAllByRole('code').some((el) => el.textContent?.includes('Container is not running'))).toBe(true),
    );
    expect(mockTryOutContainerTool).toHaveBeenCalled();
  });
});
