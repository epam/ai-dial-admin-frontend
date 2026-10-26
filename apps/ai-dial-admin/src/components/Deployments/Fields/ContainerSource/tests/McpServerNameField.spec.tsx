import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import McpServerNameField from '@/src/components/Deployments/Fields/ContainerSource/McpServerNameField';
import { BasicI18nKey } from '@/src/constants/i18n';
import { MCP_REGISTRY_PAGE_SIZE } from '@/src/constants/deployments/mcp-registry';
import { ValidationActionType } from '@/src/context/SaveValidationContext';
import { ApplicationRoute } from '@/src/types/routes';

const mockDispatch = vi.fn();

vi.mock('@/src/context/SaveValidationContext', () => ({
  useSaveValidationContext: () => ({ dispatch: mockDispatch, resetCounter: 0 }),
  ValidationActionType: {
    SetField: 'SET_FIELD_VALIDATION',
    RemoveField: 'REMOVE_FIELD_VALIDATION',
  },
}));

const noopFetch = vi.fn(() => Promise.resolve({ success: true, response: { servers: [] } } as never));

const renderField = (serverName: string) =>
  render(
    <McpServerNameField
      fetchServers={noopFetch}
      onServerSelect={vi.fn()}
      serverName={serverName}
      onServerNameChange={vi.fn()}
      view={ApplicationRoute.Toolsets}
    />,
  );

describe('McpServerNameField validation lifecycle', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  test('registers mcpServerName as invalid on mount when serverName is empty', () => {
    renderField('');

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'mcpServerName',
      isValid: false,
    });
  });

  test('registers mcpServerName as valid on mount when serverName is well-formed', () => {
    renderField('namespace/server-name');

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'mcpServerName',
      isValid: true,
    });
  });

  test('dispatches RemoveField for mcpServerName on unmount', () => {
    const { unmount } = renderField('');

    mockDispatch.mockClear();
    unmount();

    expect(mockDispatch).toHaveBeenCalledWith({
      type: ValidationActionType.RemoveField,
      field: 'mcpServerName',
    });
  });
});

describe('McpServerNameField stale-response guard (Issue #3053)', () => {
  const SERVER_NAME = 'namespace/server-name';
  const VERSION = '1.0.0';

  const serverResponse = {
    success: true,
    response: { servers: [{ server: { name: SERVER_NAME, version: VERSION } }] },
  } as never;

  beforeEach(() => {
    vi.useFakeTimers();
    mockDispatch.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Selects the typeahead suggestion, leaving a registry lookup in flight.
  const pickSuggestion = async (fetchServers: ReturnType<typeof vi.fn>) => {
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: SERVER_NAME } });
    // flush the debounced options fetch + its resolution + the re-render
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
      await Promise.resolve();
    });
    fireEvent.click(screen.getByRole('option'));
    expect(fetchServers).toHaveBeenCalled();
    return input;
  };

  test('does not apply a lookup that resolves after the search is changed', async () => {
    let resolveLookup!: (value: unknown) => void;
    const fetchServers = vi
      .fn()
      .mockResolvedValueOnce(serverResponse) // options fetch
      .mockImplementationOnce(() => new Promise((res) => (resolveLookup = res))) // in-flight lookup
      .mockResolvedValue(serverResponse);
    const onServerSelect = vi.fn();

    render(
      <McpServerNameField
        fetchServers={fetchServers}
        onServerSelect={onServerSelect}
        serverName=""
        onServerNameChange={vi.fn()}
        view={ApplicationRoute.Images}
      />,
    );

    const input = await pickSuggestion(fetchServers);

    // User searches for something else before the lookup comes back.
    fireEvent.change(input, { target: { value: 'another-server' } });
    // The stale lookup finally resolves with a match.
    await act(async () => {
      resolveLookup(serverResponse);
      await Promise.resolve();
    });

    expect(onServerSelect).not.toHaveBeenCalled();
  });

  test('applies a lookup that resolves while the input is unchanged', async () => {
    let resolveLookup!: (value: unknown) => void;
    const fetchServers = vi
      .fn()
      .mockResolvedValueOnce(serverResponse) // options fetch
      .mockImplementationOnce(() => new Promise((res) => (resolveLookup = res))) // in-flight lookup
      .mockResolvedValue(serverResponse);
    const onServerSelect = vi.fn();

    render(
      <McpServerNameField
        fetchServers={fetchServers}
        onServerSelect={onServerSelect}
        serverName=""
        onServerNameChange={vi.fn()}
        view={ApplicationRoute.Images}
      />,
    );

    await pickSuggestion(fetchServers);

    await act(async () => {
      resolveLookup(serverResponse);
      await Promise.resolve();
    });

    expect(onServerSelect).toHaveBeenCalledWith(expect.objectContaining({ name: SERVER_NAME, version: VERSION }));
  });

  test('does not apply an older-version lookup that resolves after a newer-version pick of the same name', async () => {
    const twoVersions = {
      success: true,
      response: {
        servers: [
          { server: { name: SERVER_NAME, version: '1.0.0' } },
          { server: { name: SERVER_NAME, version: '2.0.0' } },
        ],
      },
    } as never;

    let resolveOld!: (value: unknown) => void;
    const fetchServers = vi
      .fn()
      .mockResolvedValueOnce(twoVersions) // options fetch
      .mockImplementationOnce(() => new Promise((res) => (resolveOld = res))) // lookup for 1.0.0 (slow)
      .mockResolvedValueOnce(twoVersions) // lookup for 2.0.0 (fast)
      .mockResolvedValue(twoVersions);
    const onServerSelect = vi.fn();

    render(
      <McpServerNameField
        fetchServers={fetchServers}
        onServerSelect={onServerSelect}
        serverName=""
        onServerNameChange={vi.fn()}
        view={ApplicationRoute.Images}
      />,
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: SERVER_NAME } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
      await Promise.resolve();
    });

    // Pick 1.0.0 — its lookup stays in flight.
    fireEvent.click(screen.getAllByRole('option')[0]);
    // Reopen and pick 2.0.0 — its lookup resolves immediately and is applied.
    fireEvent.focus(input);
    await act(async () => {
      fireEvent.click(screen.getAllByRole('option')[1]);
      await Promise.resolve();
    });

    // The slow 1.0.0 lookup finally resolves — it must be dropped, not applied over 2.0.0.
    await act(async () => {
      resolveOld(twoVersions);
      await Promise.resolve();
    });

    expect(onServerSelect).toHaveBeenCalledOnce();
    expect(onServerSelect).toHaveBeenCalledWith(expect.objectContaining({ name: SERVER_NAME, version: '2.0.0' }));
  });
});

describe('McpServerNameField free-text entry', () => {
  const SERVER_NAME = 'namespace/server-name';
  const serverResponse = {
    success: true,
    response: { servers: [{ server: { name: SERVER_NAME, version: '1.2.0' } }] },
  } as never;

  const renderEditable = (serverName = '') => {
    const fetchServers = vi.fn(() => Promise.resolve(serverResponse));
    const onServerSelect = vi.fn();
    const onServerNameChange = vi.fn();
    render(
      <McpServerNameField
        fetchServers={fetchServers}
        onServerSelect={onServerSelect}
        serverName={serverName}
        onServerNameChange={onServerNameChange}
        view={ApplicationRoute.Images}
      />,
    );
    return { fetchServers, onServerSelect, onServerNameChange, input: screen.getByRole('combobox') };
  };

  beforeEach(() => {
    vi.useFakeTimers();
    mockDispatch.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const flushSuggestions = () =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(150);
      await Promise.resolve();
    });

  test('commits a typed name on blur and runs freeform validation for it', async () => {
    const { fetchServers, onServerNameChange, onServerSelect, input } = renderEditable();

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: SERVER_NAME } });
    expect(onServerNameChange).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.blur(input);
      await Promise.resolve();
    });

    expect(onServerNameChange).toHaveBeenCalledWith(SERVER_NAME);
    expect(fetchServers).toHaveBeenCalledWith({ search: SERVER_NAME, limit: MCP_REGISTRY_PAGE_SIZE });
    expect(onServerSelect).toHaveBeenCalledWith(expect.objectContaining({ name: SERVER_NAME, version: '1.2.0' }));
  });

  test('shows registry results unfiltered, labelled by name and described by version', async () => {
    const { fetchServers, input } = renderEditable();

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'nam' } });
    await flushSuggestions();

    expect(fetchServers).toHaveBeenCalledWith({ search: 'nam', limit: MCP_REGISTRY_PAGE_SIZE });
    expect(screen.getByRole('option').textContent).toContain(SERVER_NAME);
    expect(screen.getByRole('option').textContent).toContain('1.2.0');
  });

  test('asks for a full registry page and suggests the first five servers', async () => {
    const page = {
      success: true,
      response: {
        servers: Array.from({ length: 8 }, (_, index) => ({
          server: { name: `namespace/server-${index}`, version: '1.0.0' },
        })),
      },
    } as never;
    const { fetchServers, input } = renderEditable();
    fetchServers.mockResolvedValue(page);

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'namespace' } });
    await flushSuggestions();

    expect(fetchServers).toHaveBeenCalledWith({ search: 'namespace', limit: MCP_REGISTRY_PAGE_SIZE });
    expect(screen.getAllByRole('option')).toHaveLength(5);
  });

  test('a pick keeps its version and the following blur starts no second lookup', async () => {
    const { fetchServers, onServerSelect, input } = renderEditable();

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: SERVER_NAME } });
    await flushSuggestions();
    await act(async () => {
      fireEvent.click(screen.getByRole('option'));
      await Promise.resolve();
    });
    fetchServers.mockClear();
    await act(async () => {
      fireEvent.blur(input);
      await Promise.resolve();
    });

    expect(fetchServers).not.toHaveBeenCalled();
    expect(onServerSelect).toHaveBeenCalledOnce();
    expect(onServerSelect).toHaveBeenCalledWith(expect.objectContaining({ name: SERVER_NAME, version: '1.2.0' }));
  });

  test('leaving an untouched field does not resolve the server again', async () => {
    const { fetchServers, onServerSelect, input } = renderEditable(SERVER_NAME);

    fireEvent.focus(input);
    await act(async () => {
      fireEvent.blur(input);
      await Promise.resolve();
    });

    expect(fetchServers).not.toHaveBeenCalled();
    expect(onServerSelect).not.toHaveBeenCalled();
  });
});

describe('McpServerNameField suggestion loading', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockDispatch.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('shows a spinner while registry results load and drops a stale response', async () => {
    let resolveFirst!: (value: unknown) => void;
    const fetchServers = vi
      .fn()
      .mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValue({
        success: true,
        response: { servers: [{ server: { name: 'namespace/fresh', version: '2.0.0' } }] },
      });
    render(
      <McpServerNameField
        fetchServers={fetchServers}
        onServerSelect={vi.fn()}
        serverName=""
        onServerNameChange={vi.fn()}
        view={ApplicationRoute.Images}
      />,
    );
    const input = screen.getByRole('combobox');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'nam' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    expect(screen.getByRole('img', { name: BasicI18nKey.Loading })).toBeTruthy();

    fireEvent.change(input, { target: { value: 'names' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
      await Promise.resolve();
    });
    await act(async () => {
      resolveFirst({
        success: true,
        response: { servers: [{ server: { name: 'namespace/stale', version: '1.0.0' } }] },
      });
      await Promise.resolve();
    });

    expect(screen.getByRole('option').textContent).toContain('namespace/fresh');
    expect(screen.queryByRole('img', { name: BasicI18nKey.Loading })).toBeNull();
  });
});
