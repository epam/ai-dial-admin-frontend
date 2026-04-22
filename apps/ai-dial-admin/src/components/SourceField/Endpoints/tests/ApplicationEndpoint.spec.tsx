import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import ApplicationEndpoint from '@/src/components/SourceField/Endpoints/ApplicationEndpoint';
import { ApplicationMCPConfigDelivery, DialApplication } from '@/src/models/dial/application';

vi.mock('@epam/ai-dial-ui-kit', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@epam/ai-dial-ui-kit');
  return {
    ...actual,
    DialCheckbox: ({ id, label, checked, onChange, disabled }: any) => (
      <label>
        <input
          type="checkbox"
          aria-label={label}
          data-testid={`checkbox-${id}`}
          checked={!!checked}
          disabled={!!disabled}
          onChange={(e) => onChange(e.target.checked, id)}
        />
        {label}
      </label>
    ),
    DialSwitch: ({ switchId, isOn, onChange, label, disabled }: any) => (
      <label>
        <input
          type="checkbox"
          aria-label={label}
          data-testid={`switch-${switchId}`}
          checked={!!isOn}
          disabled={!!disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
    ),
    DialSelectField: ({ id, options, onChange, value, disabled }: any) => (
      <select
        aria-label={id}
        data-testid={`select-${id}`}
        value={value ?? ''}
        disabled={!!disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">--</option>
        {options?.map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    ),
  };
});

vi.mock('@/src/components/BaseControls/Endpoint/Endpoint', () => ({
  __esModule: true,
  default: ({ id, endpoint, onChange, disabled }: any) => (
    <input
      type="text"
      data-testid={`endpoint-${id}`}
      value={endpoint ?? ''}
      disabled={!!disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock('@/src/components/BaseControls/Endpoint/ViewerUrl', () => ({
  __esModule: true,
  default: ({ endpoint, onChange, disabled }: any) => (
    <input
      type="text"
      data-testid="viewer-url"
      value={endpoint ?? ''}
      disabled={!!disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock('@/src/components/BaseControls/Endpoint/EditorUrl', () => ({
  __esModule: true,
  default: ({ endpoint, onChange, disabled }: any) => (
    <input
      type="text"
      data-testid="editor-url"
      value={endpoint ?? ''}
      disabled={!!disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const makeEntity = (fields: Partial<DialApplication> = {}): DialApplication =>
  ({
    name: 'test-app',
    displayName: 'Test App',
    ...fields,
  }) as unknown as DialApplication;

describe('ApplicationEndpoint', () => {
  test('renders both chat endpoint and MCP endpoint checkboxes', () => {
    render(<ApplicationEndpoint entity={makeEntity()} onChange={vi.fn()} />);

    expect(screen.getByTestId('checkbox-chat_endpoint')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-mcp_endpoint')).toBeInTheDocument();
  });

  test('chat endpoint input writes to entity.endpoint', () => {
    const onChange = vi.fn();
    render(<ApplicationEndpoint entity={makeEntity({ endpoint: '' })} onChange={onChange} />);

    const input = screen.getByTestId('endpoint-endpoint');
    fireEvent.change(input, { target: { value: 'https://chat.example.com' } });

    const last = onChange.mock.calls.at(-1)?.[0] as DialApplication;
    expect(last.endpoint).toBe('https://chat.example.com');
  });

  test('MCP checkbox activation exposes MCP endpoint input; writes to entity.mcp.endpoint', () => {
    const onChange = vi.fn();
    render(<ApplicationEndpoint entity={makeEntity()} onChange={onChange} />);

    const mcpCheckbox = screen.getByTestId('checkbox-mcp_endpoint');
    fireEvent.click(mcpCheckbox);

    const mcpInput = screen.getByTestId('endpoint-mcp_endpoint');
    fireEvent.change(mcpInput, { target: { value: 'https://mcp.example.com/sse' } });

    const last = onChange.mock.calls.at(-1)?.[0] as DialApplication;
    expect(last.mcp?.endpoint).toBe('https://mcp.example.com/sse');
  });

  test('both-off prevented: when only chat is on, chat checkbox is disabled', () => {
    render(<ApplicationEndpoint entity={makeEntity({ endpoint: 'https://chat.example.com' })} onChange={vi.fn()} />);

    const chatCheckbox = screen.getByTestId('checkbox-chat_endpoint') as HTMLInputElement;
    expect(chatCheckbox.checked).toBe(true);
    expect(chatCheckbox.disabled).toBe(true);
  });

  test('both-off prevented: when only MCP is on, MCP checkbox is disabled', () => {
    const entity = makeEntity({ mcp: { endpoint: 'https://mcp.example.com' } });
    // force initial state — when mcp is set and endpoint is not, chat checkbox defaults false per useState init
    render(<ApplicationEndpoint entity={entity} onChange={vi.fn()} />);

    const mcpCheckbox = screen.getByTestId('checkbox-mcp_endpoint') as HTMLInputElement;
    expect(mcpCheckbox.checked).toBe(true);
    expect(mcpCheckbox.disabled).toBe(true);
  });

  test('MCP forwardPerRequestKey switch writes to entity.mcp.forwardPerRequestKey', () => {
    const onChange = vi.fn();
    render(
      <ApplicationEndpoint entity={makeEntity({ mcp: { endpoint: 'https://mcp.example.com' } })} onChange={onChange} />,
    );

    const switchEl = screen.getByTestId('switch-forwardPerRequestKey');
    fireEvent.click(switchEl);

    const last = onChange.mock.calls.at(-1)?.[0] as DialApplication;
    expect(last.mcp?.forwardPerRequestKey).toBe(true);
    expect(last.mcp?.endpoint).toBe('https://mcp.example.com');
  });

  test('MCP configDelivery select writes to entity.mcp.configDelivery', () => {
    const onChange = vi.fn();
    render(
      <ApplicationEndpoint entity={makeEntity({ mcp: { endpoint: 'https://mcp.example.com' } })} onChange={onChange} />,
    );

    const select = screen.getByTestId('select-configDelivery');
    const firstOption = Object.values(ApplicationMCPConfigDelivery)[0];
    fireEvent.change(select, { target: { value: firstOption } });

    const last = onChange.mock.calls.at(-1)?.[0] as DialApplication;
    expect(last.mcp?.configDelivery).toBe(firstOption);
  });

  test('writes to entity.mcp (not entity.source)', () => {
    const onChange = vi.fn();
    render(<ApplicationEndpoint entity={makeEntity()} onChange={onChange} />);

    fireEvent.click(screen.getByTestId('checkbox-mcp_endpoint'));
    const mcpInput = screen.getByTestId('endpoint-mcp_endpoint');
    fireEvent.change(mcpInput, { target: { value: 'https://mcp.example.com' } });

    const last = onChange.mock.calls.at(-1)?.[0] as DialApplication & { source?: unknown };
    expect(last.mcp).toBeDefined();
    expect(last.source).toBeUndefined();
  });

  test('ViewerUrl and EditorUrl controls render only when isEntityImmutable is true', () => {
    const { rerender } = render(<ApplicationEndpoint entity={makeEntity()} onChange={vi.fn()} />);
    expect(screen.queryByTestId('viewer-url')).not.toBeInTheDocument();
    expect(screen.queryByTestId('editor-url')).not.toBeInTheDocument();

    rerender(<ApplicationEndpoint entity={makeEntity()} onChange={vi.fn()} isEntityImmutable />);
    expect(screen.getByTestId('viewer-url')).toBeInTheDocument();
    expect(screen.getByTestId('editor-url')).toBeInTheDocument();
  });

  test('ViewerUrl writes to entity.viewerUrl; EditorUrl writes to entity.editorUrl', () => {
    const onChange = vi.fn();
    render(<ApplicationEndpoint entity={makeEntity()} onChange={onChange} isEntityImmutable />);

    fireEvent.change(screen.getByTestId('viewer-url'), { target: { value: 'https://viewer.example.com' } });
    let last = onChange.mock.calls.at(-1)?.[0] as DialApplication;
    expect(last.viewerUrl).toBe('https://viewer.example.com');

    fireEvent.change(screen.getByTestId('editor-url'), { target: { value: 'https://editor.example.com' } });
    last = onChange.mock.calls.at(-1)?.[0] as DialApplication;
    expect(last.editorUrl).toBe('https://editor.example.com');
  });
});
