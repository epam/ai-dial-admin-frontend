import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { CatalogEntityType } from '@/src/models/dial/catalog-schema';
import { DialCatalogSchemaResource } from '@/src/models/dial/resource';
import CatalogSchemaCreateProperties from '../CreateProperties';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@epam/ai-dial-ui-kit')>()),
  DialSelectField: ({ id, label, value, options, onChange }: any) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="" />
        {options?.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

const schema = (overrides: Partial<DialCatalogSchemaResource> = {}): DialCatalogSchemaResource =>
  ({
    $id: 'https://dial.epam.com/catalog_schemas/agent',
    'dial:catalogEntityType': CatalogEntityType.Agent,
    'dial:catalogDisplayName': 'Agent',
    ...overrides,
  }) as DialCatalogSchemaResource;

const renderForm = (entity: DialCatalogSchemaResource, isModal = true, onChangeEntity = vi.fn()) => {
  render(
    <CatalogSchemaCreateProperties entity={entity} names={[]} isModal={isModal} onChangeEntity={onChangeEntity} />,
  );
  return onChangeEntity;
};

describe('CatalogSchemaCreateProperties', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Should render the four catalog fields and nothing deployment-shaped', () => {
    renderForm(schema());

    expect(screen.getByText(EntityFieldsI18nKey.catalogEntityType)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.catalogDefaultLocale)).toBeInTheDocument();
    expect(screen.queryByText(EntityFieldsI18nKey.baseUrl)).not.toBeInTheDocument();
    expect(screen.queryByText(EntityFieldsI18nKey.endpoint)).not.toBeInTheDocument();
  });

  const offeredEntityTypes = () =>
    within(screen.getByRole('combobox', { name: EntityFieldsI18nKey.catalogEntityType }))
      .getAllByRole('option')
      .map((option) => option.textContent)
      .filter(Boolean);

  test('Should offer the four entity types the console allows authoring, in Core order', () => {
    renderForm(schema());

    expect(offeredEntityTypes()).toEqual(['Model', 'Agent', 'Toolset', 'Interceptor']);
  });

  /**
   * A skill cannot carry a catalog schema, so offering it would invite authoring a schema nothing
   * can reference. The save gate still accepts it — see the next test and `validation.spec.ts`.
   */
  test('Should not offer skill as an entity type', () => {
    renderForm(schema());

    expect(offeredEntityTypes()).not.toContain('Skill');
  });

  test('Should still offer the declared kind of a schema a configuration file typed skill', () => {
    renderForm(schema({ 'dial:catalogEntityType': CatalogEntityType.Skill }));

    expect(offeredEntityTypes()).toEqual(['Model', 'Agent', 'Toolset', 'Interceptor', 'Skill']);
    expect(screen.getByRole('combobox', { name: EntityFieldsI18nKey.catalogEntityType })).toHaveValue(
      CatalogEntityType.Skill,
    );
  });

  test('Should write the typed id to $id rather than to the generic name field', async () => {
    const user = userEvent.setup();
    const onChangeEntity = renderForm(schema({ $id: undefined }));

    await user.type(screen.getByRole('textbox', { name: /id/i }), 'x');

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ $id: 'x' }));
    expect(onChangeEntity.mock.calls[0][0]).not.toHaveProperty('name');
  });

  test('Should keep the id editable in the create modal', () => {
    renderForm(schema(), true);

    expect(screen.getByRole('textbox', { name: /id/i })).toBeEnabled();
  });

  test('Should render the id read-only on the details view, where it is the Core resource name', () => {
    renderForm(schema(), false);

    expect(screen.getByRole('textbox', { name: /id/i })).toBeDisabled();
  });

  test('Should report a malformed default locale inline', () => {
    renderForm(schema({ 'dial:defaultLocale': 'EN' }));

    expect(screen.getByText(ErrorI18nKey.LocaleField)).toBeInTheDocument();
  });

  test.each(['en', 'en-US'])('Should accept the default locale %s without an error', (locale) => {
    renderForm(schema({ 'dial:defaultLocale': locale }));

    expect(screen.queryByText(ErrorI18nKey.LocaleField)).not.toBeInTheDocument();
  });

  test('Should write the display name under dial:catalogDisplayName', async () => {
    const user = userEvent.setup();
    const onChangeEntity = renderForm(schema({ 'dial:catalogDisplayName': '' }));

    await user.type(screen.getAllByRole('textbox')[2], 'A');

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ 'dial:catalogDisplayName': 'A' }));
  });
});
