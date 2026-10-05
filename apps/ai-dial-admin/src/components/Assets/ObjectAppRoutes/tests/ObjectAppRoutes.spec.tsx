import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import ObjectAppRoutes from '@/src/components/Assets/ObjectAppRoutes/ObjectAppRoutes';
import {
  ObjectAppRouteFormat,
  ObjectAppRoutes as ObjectAppRoutesModel,
} from '@/src/components/Assets/ObjectAppRoutes/models';

vi.mock('@/src/components/EntityView/AppRoute/Content/RouteContent', () => ({
  default: ({ route, onChangeRoute }: any) => (
    <button type="button" onClick={() => onChangeRoute({ ...route, name: 'renamed' })}>
      Edit {route.name}
    </button>
  ),
}));

vi.mock('@/src/components/EntityView/AppRoute/CreateRoute', () => ({
  default: ({ onCreate }: any) => (
    <button type="button" onClick={() => onCreate('created')}>
      Confirm create
    </button>
  ),
}));

const routes: ObjectAppRoutesModel = {
  health: { 'dial:paths': ['/health'], 'dial:methods': ['GET'], 'dial:upstreams': [] },
};

describe('ObjectAppRoutes', () => {
  test('renames a Core route by replacing its object key', async () => {
    const onChangeRoutes = vi.fn();
    const user = userEvent.setup();

    render(<ObjectAppRoutes routes={routes} format={ObjectAppRouteFormat.AppRunner} onChangeRoutes={onChangeRoutes} />);

    await user.click(screen.getByRole('button', { name: 'Edit health' }));

    expect(onChangeRoutes).toHaveBeenCalledWith({
      renamed: { 'dial:paths': ['/health'], 'dial:methods': ['GET'], 'dial:upstreams': [] },
    });
  });

  test('creates an object entry with the selected field contract', async () => {
    const onChangeRoutes = vi.fn();
    const user = userEvent.setup();

    render(
      <ObjectAppRoutes routes={{}} format={ObjectAppRouteFormat.AssetApplication} onChangeRoutes={onChangeRoutes} />,
    );

    await user.click(screen.getByRole('button', { name: 'Buttons.Add' }));
    await user.click(screen.getByRole('button', { name: 'Confirm create' }));

    expect(onChangeRoutes).toHaveBeenCalledWith(
      expect.objectContaining({
        created: expect.objectContaining({ name: 'created', paths: [''], upstreams: [] }),
      }),
    );
  });
});
