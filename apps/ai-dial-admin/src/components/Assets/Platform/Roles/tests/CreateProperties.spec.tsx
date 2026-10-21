import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import Properties from '@/src/components/EntityMainProperties/Properties/Properties';
import { DialRoleResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';

const renderCreateForm = (onChangeEntity: (entity: object) => void, entity = {} as DialRoleResource) =>
  render(
    <Properties
      view={ApplicationRoute.PlatformRoles}
      entity={entity}
      names={[]}
      isModal
      onChangeEntity={onChangeEntity}
    />,
  );

/**
 * The create modal reaches this form through the shared `Properties` dispatcher. Falling through to
 * the generic entity form looks correct on screen but always seeds `displayName`/`description` —
 * neither of which `Role` has — and Core rejects the whole write once either field is present.
 */
describe('Role asset :: create form', () => {
  test('Should write the name the user types to name', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: /id/i }), { target: { value: 'my-role' } });

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ name: 'my-role' }));
  });

  test('Should render no display-name or description control', () => {
    renderCreateForm(vi.fn());

    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });
});
