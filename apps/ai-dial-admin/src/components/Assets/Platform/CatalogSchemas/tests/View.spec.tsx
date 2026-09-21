import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { updateCatalogSchema } from '@/src/app/[lang]/platform-catalog-schemas/actions';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { CatalogEntityType } from '@/src/models/dial/catalog-schema';
import { DialCatalogSchemaResource } from '@/src/models/dial/resource';
import CatalogSchemaView from '../View';

const showNotificationSpy = vi.fn();
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification: showNotificationSpy, removeNotification: vi.fn() }),
}));

vi.mock('@/src/app/[lang]/platform-catalog-schemas/actions', () => ({
  updateCatalogSchema: vi.fn().mockResolvedValue({ success: true }),
  removeCatalogSchema: vi.fn(),
  getCatalogSchemas: vi.fn().mockResolvedValue([]),
}));

let capturedJsonConfiguration: any;
vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({ onSave, jsonConfiguration }: any) => {
    capturedJsonConfiguration = jsonConfiguration;
    return (
      <button type="button" onClick={onSave}>
        save
      </button>
    );
  },
}));

const setEntityReadOnly = vi.fn();
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ setEntityReadOnly }),
}));

vi.mock('../TabsContent', () => ({ default: () => <div>tabs-content</div> }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const schema = (overrides: Partial<DialCatalogSchemaResource> = {}): DialCatalogSchemaResource =>
  ({
    $id: 'https://dial.epam.com/catalog_schemas/agent',
    'dial:catalogEntityType': CatalogEntityType.Agent,
    'dial:catalogDisplayName': 'Agent',
    name: 'https%3A%2F%2Fdial.epam.com%2Fcatalog_schemas%2Fagent',
    path: 'https%3A%2F%2Fdial.epam.com%2Fcatalog_schemas%2Fagent',
    folderId: '',
    ...overrides,
  }) as DialCatalogSchemaResource;

const clickSave = async (entity: DialCatalogSchemaResource) => {
  const user = userEvent.setup();
  render(<CatalogSchemaView etag="etag" originalSchema={entity} />);
  await user.click(screen.getByRole('button', { name: 'save' }));
};

describe('CatalogSchemaView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Should send the schema to Core with its etag on save', async () => {
    await clickSave(schema());

    expect(updateCatalogSchema).toHaveBeenCalledWith(expect.objectContaining({ $id: expect.any(String) }), 'etag');
  });

  test.each([
    ['a blank display name', { 'dial:catalogDisplayName': '' }],
    ['no entity type', { 'dial:catalogEntityType': undefined }],
    ['a malformed default locale', { 'dial:defaultLocale': 'EN' }],
  ])('Should block the save and report %s instead of reaching Core', async (_label, overrides) => {
    await clickSave(schema(overrides as Partial<DialCatalogSchemaResource>));

    expect(updateCatalogSchema).not.toHaveBeenCalled();
    expect(showNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: EntitiesI18nKey.InvalidCatalogSchema }),
    );
  });

  test('Should block a save whose file property is missing its format', async () => {
    await clickSave(
      schema({
        properties: { badge: { type: 'string', 'dial:file': true } } as DialCatalogSchemaResource['properties'],
      }),
    );

    expect(updateCatalogSchema).not.toHaveBeenCalled();
  });

  test('Should surface the server message when Core refuses the write', async () => {
    (updateCatalogSchema as any).mockResolvedValueOnce({
      success: false,
      errorHeader: 'Conflict',
      errorMessage: 'Schema $id cannot be changed after creation',
    });

    await clickSave(schema());

    expect(showNotificationSpy).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Schema $id cannot be changed after creation' }),
    );
  });
});

describe('CatalogSchemaView :: config-file source', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('marks a file-declared schema read-only and hides the format selector', () => {
    const { unmount } = render(<CatalogSchemaView etag="etag" originalSchema={schema()} isConfigFileSource />);

    expect(setEntityReadOnly).toHaveBeenCalledWith(true);
    expect(capturedJsonConfiguration?.onHideFormatSelector?.()).toBe(true);

    unmount();

    expect(setEntityReadOnly).toHaveBeenLastCalledWith(false);
  });

  test('leaves an API-written schema editable', () => {
    render(<CatalogSchemaView etag="etag" originalSchema={schema()} />);

    expect(setEntityReadOnly).toHaveBeenCalledWith(false);
    expect(capturedJsonConfiguration?.onHideFormatSelector?.()).toBe(false);
  });
});
