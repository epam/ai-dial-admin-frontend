import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { CatalogEntityType } from '@/src/models/dial/catalog-schema';
import { DialCatalogSchemaResource } from '@/src/models/dial/resource';
import CatalogSchemaCreateProperties from '../CreateProperties';

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

    await user.type(screen.getAllByRole('textbox')[1], 'A');

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ 'dial:catalogDisplayName': 'A' }));
  });
});
