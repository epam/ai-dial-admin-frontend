import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import Properties from '@/src/components/EntityMainProperties/Properties/Properties';
import { EntityFieldsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';

const ID_URL = 'https://mydial.epam.com/custom_application_schemas/qq';

const renderCreateForm = (
  onChangeEntity: (entity: object) => void,
  entity = {} as DialAppRunnerResource,
  externalIdError?: string,
) =>
  render(
    <Properties
      view={ApplicationRoute.PlatformAppRunners}
      entity={entity}
      names={[]}
      externalIdError={externalIdError}
      isModal
      onChangeEntity={onChangeEntity}
    />,
  );

describe('App runner asset :: create form', () => {
  test('writes the storage name separately from the declared id', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: new RegExp(EntityFieldsI18nKey.name) }), {
      target: { value: 'runner' },
    });

    expect(onChangeEntity).toHaveBeenCalledWith({ name: 'runner' });
  });

  test('writes the declared id to $id without overwriting the storage name', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity, { name: 'runner' } as DialAppRunnerResource);

    fireEvent.change(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.id}*` }), {
      target: { value: ID_URL },
    });

    expect(onChangeEntity).toHaveBeenCalledWith({ name: 'runner', $id: ID_URL });
  });

  test('renders an external declared ID collision error', () => {
    renderCreateForm(vi.fn(), { $id: ID_URL } as DialAppRunnerResource, ErrorI18nKey.NameExists);

    expect(screen.getByText(ErrorI18nKey.NameExists)).toBeInTheDocument();
  });

  test('rejects a declared id containing a character Core cannot store', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.id}*` }), {
      target: { value: `${ID_URL}1!` },
    });

    expect(screen.getByText(ErrorI18nKey.ForbiddenChars)).toBeInTheDocument();
  });

  test('accepts a declared id with no forbidden characters', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.id}*` }), {
      target: { value: ID_URL },
    });

    expect(screen.queryByText(ErrorI18nKey.ForbiddenChars)).not.toBeInTheDocument();
  });
});
