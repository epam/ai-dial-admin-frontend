import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import Properties from '@/src/components/EntityMainProperties/Properties/Properties';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

const renderCreateForm = (onChangeEntity: (entity: object) => void) =>
  render(
    <Properties
      view={ApplicationRoute.PlatformRouters}
      entity={{}}
      names={[]}
      isModal
      onChangeEntity={onChangeEntity}
    />,
  );

describe('Router asset :: create form', () => {
  test('Should write the name the user types to name', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: /id/i }), { target: { value: 'cost-aware' } });

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ name: 'cost-aware' }));
  });

  test('Should offer id, display name, display version and description', () => {
    renderCreateForm(vi.fn());

    expect(screen.getByText(EntityFieldsI18nKey.id)).toBeTruthy();
    expect(screen.getByText(EntityFieldsI18nKey.displayName)).toBeTruthy();
    expect(screen.getByText(EntityFieldsI18nKey.displayVersion)).toBeTruthy();
    expect(screen.getByText(EntityFieldsI18nKey.description)).toBeTruthy();
  });

  test('Should write the display version the user types', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: new RegExp(EntityFieldsI18nKey.displayVersion) }), {
      target: { value: '1.2' },
    });

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ displayVersion: '1.2' }));
  });
});
