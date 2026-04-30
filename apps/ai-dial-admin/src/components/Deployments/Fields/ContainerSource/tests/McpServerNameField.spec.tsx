import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import McpServerNameField from '@/src/components/Deployments/Fields/ContainerSource/McpServerNameField';
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
