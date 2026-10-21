import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import Properties from '@/src/components/EntityMainProperties/Properties/Properties';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { DialTranslatorResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';

const renderCreateForm = (onChangeEntity: (entity: object) => void, entity = {} as DialTranslatorResource) =>
  render(
    <Properties
      view={ApplicationRoute.PlatformTranslators}
      entity={entity}
      names={[]}
      isModal
      onChangeEntity={onChangeEntity}
    />,
  );

/**
 * The create modal reaches this form through the shared `Properties` dispatcher. Falling through to
 * the generic entity form looks correct on screen but always seeds `displayName`/`description` —
 * neither of which `Translator` has — and Core rejects the whole write once either field is present.
 * Unlike `Route`/`Role`, Core's `Translator.class` also requires `out`/`baseUrl` on every write (and
 * rejects a registry entry declaring no `in`), so this form — unlike `RouteCreateProperties`/
 * `RoleCreateProperties` — collects those too.
 */
describe('Translator asset :: create form', () => {
  test('Should write the name the user types to name', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: /id/i }), { target: { value: 'to-responses' } });

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ name: 'to-responses' }));
  });

  test('Should render no display-name or description control, only id and baseUrl', () => {
    renderCreateForm(vi.fn());

    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  test('Should render the in/out interface selects', () => {
    renderCreateForm(vi.fn());

    expect(screen.getByText(EntityFieldsI18nKey.translatorIn)).toBeTruthy();
    expect(screen.getByText(EntityFieldsI18nKey.translatorOut)).toBeTruthy();
  });

  test('Should write the entered base URL to baseUrl', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.baseUrl}*` }), {
      target: { value: 'http://dial-bedrock-translator/to-responses' },
    });

    expect(onChangeEntity).toHaveBeenCalledWith(
      expect.objectContaining({ baseUrl: 'http://dial-bedrock-translator/to-responses' }),
    );
  });
});
