import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import SourceField from '@/src/components/SourceField/SourceField';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { APPLICATION_SOURCE_ITEMS } from '@/src/components/SourceField/constants';
import { DialApplication } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@epam/ai-dial-ui-kit', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@epam/ai-dial-ui-kit');
  return {
    ...actual,
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

// Mock the branch components — this spec only tests the dropdown + clearing logic in SourceField.
vi.mock('@/src/components/SourceField/Endpoints/Endpoints', () => ({
  __esModule: true,
  default: () => <div data-testid="endpoints-branch" />,
}));
vi.mock('@/src/components/SourceField/Application/AppRunners', () => ({
  __esModule: true,
  default: () => <div data-testid="app-runners-branch" />,
}));
vi.mock('@/src/components/SourceField/Containers/Containers', () => ({
  __esModule: true,
  default: () => <div data-testid="containers-branch" />,
}));
vi.mock('@/src/components/SourceField/McpRegistry/McpRegistry', () => ({
  __esModule: true,
  default: () => <div data-testid="mcp-registry-branch" />,
}));
vi.mock('@/src/components/SourceField/Template/Templates', () => ({
  __esModule: true,
  default: () => <div data-testid="templates-branch" />,
}));
vi.mock('@/src/components/SourceField/Adapters/Adapters', () => ({
  __esModule: true,
  default: () => <div data-testid="adapters-branch" />,
}));

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: () => false,
}));

const makeApp = (overrides: Partial<DialApplication> = {}): DialApplication =>
  ({
    name: 'app-1',
    displayName: 'App',
    ...overrides,
  }) as unknown as DialApplication;

describe('SourceField view-aware clearing (Applications view)', () => {
  test('ENDPOINTS → SCHEMA clears mcp/viewerUrl/editorUrl/applicationTypeSchemaId/applicationProperties + endpoint', () => {
    const onChange = vi.fn();
    const entity = makeApp({
      source: { $type: SOURCE_TYPE.ENDPOINTS },
      endpoint: 'https://chat.example.com',
      mcp: { endpoint: 'https://mcp.example.com' },
      viewerUrl: 'https://viewer.example.com',
      editorUrl: 'https://editor.example.com',
      applicationProperties: { foo: 'bar' } as any,
    });

    render(
      <SourceField
        id="sourceType"
        view={ApplicationRoute.Applications}
        sourceItems={APPLICATION_SOURCE_ITEMS}
        entity={entity}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByTestId('select-sourceType'), { target: { value: SOURCE_TYPE.SCHEMA } });

    const last = onChange.mock.calls.at(-1)?.[0] as DialApplication;
    expect(last.source?.$type).toBe(SOURCE_TYPE.SCHEMA);
    expect(last.endpoint).toBeUndefined();
    expect(last.mcp).toBeUndefined();
    expect(last.viewerUrl).toBeUndefined();
    expect(last.editorUrl).toBeUndefined();
    expect((last as any).applicationTypeSchemaId).toBeUndefined();
    expect(last.applicationProperties).toBeUndefined();
  });

  test('SCHEMA → ENDPOINTS clears mcp/viewerUrl/editorUrl/applicationTypeSchemaId/applicationProperties + endpoint', () => {
    const onChange = vi.fn();
    const entity = makeApp({
      source: { $type: SOURCE_TYPE.SCHEMA, applicationTypeSchemaId: 'urn:runner:1' },
      applicationProperties: { foo: 'bar' } as any,
    });

    render(
      <SourceField
        id="sourceType"
        view={ApplicationRoute.Applications}
        sourceItems={APPLICATION_SOURCE_ITEMS}
        entity={entity}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByTestId('select-sourceType'), { target: { value: SOURCE_TYPE.ENDPOINTS } });

    const last = onChange.mock.calls.at(-1)?.[0] as DialApplication;
    expect(last.source?.$type).toBe(SOURCE_TYPE.ENDPOINTS);
    expect(last.endpoint).toBeUndefined();
    expect(last.mcp).toBeUndefined();
    expect(last.viewerUrl).toBeUndefined();
    expect(last.editorUrl).toBeUndefined();
    expect(last.applicationProperties).toBeUndefined();
  });

  test('renders SCHEMA branch (AppRunners) when source type is SCHEMA', () => {
    const entity = makeApp({
      source: { $type: SOURCE_TYPE.SCHEMA, applicationTypeSchemaId: 'urn:runner:1' },
    });

    render(
      <SourceField
        id="sourceType"
        view={ApplicationRoute.Applications}
        sourceItems={APPLICATION_SOURCE_ITEMS}
        entity={entity}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId('app-runners-branch')).toBeInTheDocument();
  });

  test('renders ENDPOINTS branch when source type is ENDPOINTS', () => {
    const entity = makeApp({
      source: { $type: SOURCE_TYPE.ENDPOINTS },
      endpoint: 'https://chat.example.com',
    });

    render(
      <SourceField
        id="sourceType"
        view={ApplicationRoute.Applications}
        sourceItems={APPLICATION_SOURCE_ITEMS}
        entity={entity}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId('endpoints-branch')).toBeInTheDocument();
  });

  test('ENDPOINTS → CONTAINER clears mcp/viewerUrl/editorUrl/applicationTypeSchemaId/applicationProperties', () => {
    const onChange = vi.fn();
    const entity = makeApp({
      source: { $type: SOURCE_TYPE.ENDPOINTS },
      endpoint: 'https://chat.example.com',
      mcp: { endpoint: 'https://mcp.example.com' },
      viewerUrl: 'https://viewer.example.com',
      editorUrl: 'https://editor.example.com',
      applicationProperties: { key: 'val' } as any,
    });

    render(
      <SourceField
        id="sourceType"
        view={ApplicationRoute.Applications}
        sourceItems={APPLICATION_SOURCE_ITEMS}
        entity={entity}
        onChange={onChange}
        getContainers={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByTestId('select-sourceType'), { target: { value: SOURCE_TYPE.CONTAINER } });

    const last = onChange.mock.calls.at(-1)?.[0] as DialApplication;
    expect(last.source?.$type).toBe(SOURCE_TYPE.CONTAINER);
    expect(last.endpoint).toBeUndefined();
    expect(last.mcp).toBeUndefined();
    expect(last.viewerUrl).toBeUndefined();
    expect(last.editorUrl).toBeUndefined();
    expect(last.applicationProperties).toBeUndefined();
  });

  test('renders CONTAINER branch when source type is CONTAINER', () => {
    const entity = makeApp({
      source: { $type: SOURCE_TYPE.CONTAINER, containerId: 'c1' },
    });

    render(
      <SourceField
        id="sourceType"
        view={ApplicationRoute.Applications}
        sourceItems={APPLICATION_SOURCE_ITEMS}
        entity={entity}
        onChange={vi.fn()}
        getContainers={vi.fn()}
      />,
    );

    expect(screen.getByTestId('containers-branch')).toBeInTheDocument();
  });
});

describe('SourceField clearing (non-Applications view)', () => {
  test('non-Applications view only resets endpoint (no applications-specific fields)', () => {
    const onChange = vi.fn();
    const entity = {
      name: 'm',
      source: { $type: SOURCE_TYPE.ENDPOINTS },
      endpoint: 'https://model.example.com',
    } as any;

    render(
      <SourceField
        id="sourceType"
        view={ApplicationRoute.Models}
        sourceItems={[
          { value: SOURCE_TYPE.ENDPOINTS, label: 'Endpoints' },
          { value: SOURCE_TYPE.CONTAINER, label: 'Containers' },
        ]}
        entity={entity}
        onChange={onChange}
        getContainers={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByTestId('select-sourceType'), { target: { value: SOURCE_TYPE.CONTAINER } });

    const last = onChange.mock.calls.at(-1)?.[0];
    expect(last.source?.$type).toBe(SOURCE_TYPE.CONTAINER);
    expect(last.endpoint).toBeUndefined();
    // Application-specific fields should NOT appear in the reset payload for non-Applications views.
    expect('mcp' in last).toBe(false);
    expect('viewerUrl' in last).toBe(false);
    expect('editorUrl' in last).toBe(false);
    expect('applicationTypeSchemaId' in last).toBe(false);
    expect('applicationProperties' in last).toBe(false);
  });
});

describe('SourceField onChangeSource produces a clean source object', () => {
  test('MCP_REGISTRY → CONTAINER drops serverName and serverVersion from source', () => {
    const onChange = vi.fn();
    const entity = {
      name: 't',
      source: {
        $type: SOURCE_TYPE.MCP_REGISTRY,
        serverName: 'namespace/server',
        serverVersion: '1.2.3',
      },
    } as any;

    render(
      <SourceField
        id="sourceType"
        view={ApplicationRoute.Toolsets}
        sourceItems={[
          { value: SOURCE_TYPE.MCP_REGISTRY, label: 'MCP Registry' },
          { value: SOURCE_TYPE.CONTAINER, label: 'MCP Container' },
        ]}
        entity={entity}
        onChange={onChange}
        getContainers={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByTestId('select-sourceType'), { target: { value: SOURCE_TYPE.CONTAINER } });

    const last = onChange.mock.calls.at(-1)?.[0];
    expect(last.source).toEqual({ $type: SOURCE_TYPE.CONTAINER });
    expect(last.source.serverName).toBeUndefined();
    expect(last.source.serverVersion).toBeUndefined();
  });

  test('CONTAINER → ENDPOINTS drops containerId from source', () => {
    const onChange = vi.fn();
    const entity = {
      name: 't',
      source: {
        $type: SOURCE_TYPE.CONTAINER,
        containerId: 'my-container',
      },
    } as any;

    render(
      <SourceField
        id="sourceType"
        view={ApplicationRoute.Toolsets}
        sourceItems={[
          { value: SOURCE_TYPE.ENDPOINTS, label: 'External Endpoint' },
          { value: SOURCE_TYPE.CONTAINER, label: 'MCP Container' },
        ]}
        entity={entity}
        onChange={onChange}
        getContainers={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByTestId('select-sourceType'), { target: { value: SOURCE_TYPE.ENDPOINTS } });

    const last = onChange.mock.calls.at(-1)?.[0];
    expect(last.source).toEqual({ $type: SOURCE_TYPE.ENDPOINTS });
    expect(last.source.containerId).toBeUndefined();
  });
});
