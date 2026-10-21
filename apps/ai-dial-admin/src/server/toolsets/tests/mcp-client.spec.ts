import { beforeEach, describe, expect, test, vi } from 'vitest';

const connectMock = vi.fn();
const callToolMock = vi.fn();
const closeMock = vi.fn();
const clientConstructorMock = vi.fn();
const transportConstructorMock = vi.fn();

vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: class {
    constructor(...args: unknown[]) {
      clientConstructorMock(...args);
    }
    connect = connectMock;
    callTool = callToolMock;
    close = closeMock;
  },
}));

vi.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => ({
  StreamableHTTPClientTransport: class {
    constructor(...args: unknown[]) {
      transportConstructorMock(...args);
    }
  },
}));

import { buildApplicationMcpUrl, buildToolsetMcpUrl, callToolViaMcp } from '../mcp-client';

describe('Server :: Toolsets :: mcp-client :: buildToolsetMcpUrl', () => {
  test('builds the prefixed Core MCP endpoint URL', () => {
    const url = buildToolsetMcpUrl('https://core.example.com', 'public/name__1.0');
    expect(url.toString()).toBe('https://core.example.com/v1/toolset/toolsets/public/name__1.0/mcp');
  });

  // Regression (Issue #4489): Core's `DeploymentService.findDeployment` resolves a platform-bucket
  // toolset by bare name via the merged config store — the resource-type prefix and `platform/`
  // bucket segment must be stripped, not sent, or Core reports "Forbidden deployment".
  test('builds the bare-name Core MCP endpoint URL for a platform-bucket toolset', () => {
    const url = buildToolsetMcpUrl('https://core.example.com', 'platform/my-toolset');
    expect(url.toString()).toBe('https://core.example.com/v1/toolset/my-toolset/mcp');
  });
});

describe('Server :: Toolsets :: mcp-client :: buildApplicationMcpUrl', () => {
  test('builds the prefixed Core deployment MCP endpoint URL', () => {
    const url = buildApplicationMcpUrl('https://core.example.com', 'public/name__1.0');
    expect(url.toString()).toBe('https://core.example.com/v1/deployments/applications/public/name__1.0/mcp');
  });

  // Regression (Issue #4489): same bare-name resolution as the toolset route applies to a
  // platform-bucket application's deployment id.
  test('builds the bare-name Core deployment MCP endpoint URL for a platform-bucket application', () => {
    const url = buildApplicationMcpUrl('https://core.example.com', 'platform/my-app');
    expect(url.toString()).toBe('https://core.example.com/v1/deployments/my-app/mcp');
  });
});

describe('Server :: Toolsets :: mcp-client :: callToolViaMcp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('opens a transport with the bearer token, connects, calls the tool, and closes', async () => {
    connectMock.mockResolvedValue(undefined);
    callToolMock.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    closeMock.mockResolvedValue(undefined);

    const url = buildToolsetMcpUrl('https://core.example.com', 'public/name__1.0');
    const result = await callToolViaMcp(url, 'token-1' as any, {
      name: 'tool',
      arguments: {},
    });

    const [transportUrl, options] = transportConstructorMock.mock.calls[0];
    expect(transportUrl.toString()).toContain('/v1/toolset/toolsets/public/name__1.0/mcp');
    expect(options.requestInit.headers).toBeDefined();

    expect(connectMock).toHaveBeenCalled();
    expect(callToolMock).toHaveBeenCalledWith({ name: 'tool', arguments: {} });
    expect(closeMock).toHaveBeenCalled();
    expect(result).toEqual({ success: true, response: { content: [{ type: 'text', text: 'ok' }] } });
  });

  test('returns a recognizable error and still closes the session on failure', async () => {
    connectMock.mockRejectedValue(new Error('handshake failed'));
    closeMock.mockResolvedValue(undefined);

    const url = buildToolsetMcpUrl('https://core.example.com', 'public/name__1.0');
    const result = await callToolViaMcp(url, 'token-1' as any, {
      name: 'tool',
      arguments: {},
    });

    expect(result).toEqual({
      success: false,
      errorHeader: 'Tool Call Failed',
      errorMessage: 'handshake failed',
    });
    expect(closeMock).toHaveBeenCalled();
  });
});
