import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { EntitiesI18nKey, TypeI18nKey } from '@/src/constants/i18n';
import { CatalogSchemaDocument } from '@/src/models/dial/catalog-schema';
import CatalogPropertiesEditor from '../CatalogPropertiesEditor';

interface RendererProps {
  schema?: { properties?: Record<string, unknown>; required?: string[] };
  data?: Record<string, unknown>;
  onChangeConfiguration: (values: Record<string, unknown>) => void;
  disabled?: boolean;
}

let capturedRendererProps: RendererProps | undefined;

vi.mock('@/src/components/Common/SchemaUIRenderer/SchemaUIRenderer', () => ({
  default: (props: RendererProps) => {
    capturedRendererProps = props;
    return (
      <button type="button" onClick={() => props.onChangeConfiguration({ tag: 'Featured' })}>
        schema-renderer
      </button>
    );
  },
}));

interface JsonEditorProps {
  entity?: Record<string, unknown>;
  setSelectedEntity?: (values: Record<string, unknown>) => void;
  readonly?: boolean;
}

let capturedJsonProps: JsonEditorProps | undefined;

vi.mock('@/src/components/EntityTabs/JsonEditor/JsonEditor', () => ({
  default: (props: JsonEditorProps) => {
    capturedJsonProps = props;
    return (
      <button type="button" onClick={() => props.setSelectedEntity?.({ tag: 'From JSON' })}>
        json-editor
      </button>
    );
  },
}));

const SCHEMA_ID = 'https://host/agent-card';

const schema: CatalogSchemaDocument = {
  $id: SCHEMA_ID,
  properties: {
    tag: { type: 'string', enum: ['Featured', 'New'] },
    contact: { type: 'object', properties: { email: { type: 'string' } } },
    topics: { type: 'array', items: { type: 'string' } },
  },
  required: ['tag'],
};

describe('CatalogPropertiesEditor', () => {
  const renderEditor = (props?: Partial<ComponentProps<typeof CatalogPropertiesEditor>>) =>
    render(
      <CatalogPropertiesEditor
        schemaId={SCHEMA_ID}
        schema={schema}
        isLoading={false}
        hasReadFailed={false}
        errors={[]}
        onChange={vi.fn()}
        {...props}
      />,
    );

  beforeEach(() => {
    capturedRendererProps = undefined;
    capturedJsonProps = undefined;
    vi.clearAllMocks();
  });

  test('shows an empty state with no schema selected', () => {
    renderEditor({ schemaId: undefined, schema: undefined });

    expect(screen.getByText(EntitiesI18nKey.NoCatalogSchemaSelected)).toBeTruthy();
  });

  test('hands the resolved schema to the shared renderer', () => {
    renderEditor();

    expect(capturedRendererProps?.schema?.properties).toEqual(schema.properties);
    expect(capturedRendererProps?.schema?.required).toEqual(['tag']);
  });

  test('renders the enumerated, nested-object and array properties through the shared renderer', () => {
    renderEditor();

    expect(screen.getByRole('button', { name: 'schema-renderer' })).toBeTruthy();
    expect(Object.keys(capturedRendererProps?.schema?.properties ?? {})).toEqual(['tag', 'contact', 'topics']);
  });

  test('shows the stored values', () => {
    renderEditor({ values: { tag: 'New' } });

    expect(capturedRendererProps?.data).toEqual({ tag: 'New' });
  });

  test('writes an edited value back', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderEditor({ onChange });

    await user.click(screen.getByRole('button', { name: 'schema-renderer' }));

    expect(onChange).toHaveBeenCalledWith({ tag: 'Featured' });
  });

  test('says so when the schema declares no properties', () => {
    renderEditor({ schema: { $id: SCHEMA_ID } });

    expect(screen.getByText(EntitiesI18nKey.NoCatalogProperties)).toBeTruthy();
  });

  test('reports a failed schema read rather than an empty form', () => {
    renderEditor({ schema: undefined, hasReadFailed: true });

    expect(screen.getByText(EntitiesI18nKey.CatalogSchemaUnavailable)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'schema-renderer' })).toBeNull();
  });

  test('shows a loader while the schema is resolving', () => {
    renderEditor({ schema: undefined, isLoading: true });

    expect(screen.queryByRole('button', { name: 'schema-renderer' })).toBeNull();
    expect(screen.queryByText(EntitiesI18nKey.CatalogSchemaUnavailable)).toBeNull();
  });

  test('offers a raw JSON view that edits the same object', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderEditor({ values: { tag: 'New' }, onChange });

    await user.click(screen.getByRole('button', { name: `Compare.View: ${EntitiesI18nKey.Form}` }));
    await user.click(screen.getByText(TypeI18nKey.JSON));
    await user.click(screen.getByRole('button', { name: 'json-editor' }));

    expect(capturedJsonProps?.entity).toEqual({ tag: 'New' });
    expect(onChange).toHaveBeenCalledWith({ tag: 'From JSON' });
  });

  test('leaves read-only to the shared renderer and JSON editor, which read it themselves', () => {
    renderEditor();

    expect(capturedRendererProps?.disabled).toBeUndefined();
  });

  test('surfaces the validation errors it is given, naming the property', () => {
    renderEditor({ errors: [{ field: 'tag', message: '"tag" must be one of Featured, New' }] });

    expect(screen.getAllByRole('alert').map((node) => node.textContent)).toContain(
      '"tag" must be one of Featured, New',
    );
  });

  test('shows no error region for values matching the schema', () => {
    renderEditor({ values: { tag: 'New' } });

    expect(screen.queryAllByRole('alert')).toEqual([]);
  });
});

describe('CatalogPropertiesEditor — presentation metadata is inert', () => {
  const decorated: CatalogSchemaDocument = {
    $id: SCHEMA_ID,
    properties: {
      badge: {
        type: 'string',
        'dial:file': true,
        'dial:meta': { 'dial:tab': 'Overview', 'dial:section': 'Branding', 'dial:widget': 'image' },
      },
      tag: { type: 'string', 'dial:meta': { 'dial:propertyOrder': 1, 'dial:widget': 'badge' } },
    } as CatalogSchemaDocument['properties'],
  };

  const renderDecorated = () =>
    render(
      <CatalogPropertiesEditor
        schemaId={SCHEMA_ID}
        schema={decorated}
        isLoading={false}
        hasReadFailed={false}
        errors={[]}
        onChange={vi.fn()}
      />,
    );

  beforeEach(() => {
    capturedRendererProps = undefined;
    vi.clearAllMocks();
  });

  test('renders every property regardless of its tab, section, order or widget declaration', () => {
    renderDecorated();

    expect(screen.getByRole('button', { name: 'schema-renderer' })).toBeTruthy();
    expect(Object.keys(capturedRendererProps?.schema?.properties ?? {})).toEqual(['badge', 'tag']);
  });

  test('leaves the declarations untouched in the schema it passes on', () => {
    renderDecorated();

    expect(capturedRendererProps?.schema?.properties).toEqual(decorated.properties);
  });
});
