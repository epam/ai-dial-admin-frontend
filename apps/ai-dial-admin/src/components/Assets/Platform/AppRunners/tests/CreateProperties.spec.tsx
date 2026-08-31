import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import Properties from '@/src/components/EntityMainProperties/Properties/Properties';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';

const ID_URL = 'https://mydial.epam.com/custom_application_schemas/qq';

const renderCreateForm = (onChangeEntity: (entity: object) => void, entity = {} as DialAppRunnerResource) =>
  render(
    <Properties
      view={ApplicationRoute.PlatformAppRunners}
      entity={entity}
      names={[]}
      isModal
      onChangeEntity={onChangeEntity}
    />,
  );

/**
 * The create modal reaches this form through the shared `Properties` dispatcher. An app runner's
 * identity is `$id`, not `name` — a dispatcher branch that falls through to the generic entity form
 * looks correct on screen but produces a runner with no id, which only fails server-side.
 */
describe('App runner asset :: create form', () => {
  test('Should write the id the user types to $id', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: /id/i }), { target: { value: ID_URL } });

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ $id: ID_URL }));
  });

  test('Should not write the id to name, which Core would ignore', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: /id/i }), { target: { value: ID_URL } });

    expect(onChangeEntity).not.toHaveBeenCalledWith(expect.objectContaining({ name: ID_URL }));
  });

  test('Should reject an id containing a character Core cannot store', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: /id/i }), {
      target: { value: `${ID_URL}(1)` },
    });

    expect(screen.getByText(ErrorI18nKey.ForbiddenChars)).toBeInTheDocument();
  });

  test('Should accept an id with no forbidden characters', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: /id/i }), { target: { value: ID_URL } });

    expect(screen.queryByText(ErrorI18nKey.ForbiddenChars)).not.toBeInTheDocument();
  });
});
