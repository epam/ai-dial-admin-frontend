import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import ObjectAppRoutes from '@/src/components/Assets/ObjectAppRoutes/ObjectAppRoutes';
import {
  ObjectAppRouteFormat,
  ObjectAppRoutes as ObjectAppRoutesModel,
} from '@/src/components/Assets/ObjectAppRoutes/models';
import { ActionMenuOperationI18nKey, ButtonsI18nKey, EntityFieldsI18nKey, TabsI18nKey } from '@/src/constants/i18n';

const EditableAppRoutes = () => {
  const [routes, setRoutes] = useState<ObjectAppRoutesModel>({
    health: {
      'dial:paths': ['/health'],
      'dial:methods': ['GET'],
      'dial:upstreams': [],
      'dial:response': { 'dial:status': 200, 'dial:body': 'ok' },
    },
  });

  return <ObjectAppRoutes routes={routes} format={ObjectAppRouteFormat.AppRunner} onChangeRoutes={setRoutes} />;
};

describe('ObjectAppRoutes output', () => {
  test('switches between response and upstreams in both directions', async () => {
    const user = userEvent.setup();
    render(<EditableAppRoutes />);

    const response = await screen.findByRole('radio', { name: EntityFieldsI18nKey.response });
    const upstreams = screen.getByRole('radio', { name: EntityFieldsI18nKey.upstreams });
    expect(response).toBeChecked();

    await user.click(upstreams);
    expect(upstreams).toBeChecked();
    await user.click(response);
    expect(response).toBeChecked();
  });

  test.each([
    [ObjectAppRouteFormat.AssetApplication, { roleLimits: { missing: { enabled: true } } }],
    [ObjectAppRouteFormat.AppRunner, { 'dial:userRoles': ['missing'] }],
  ])('opens a Core role from the %s route owner when options are empty', async (format, route) => {
    const user = userEvent.setup();
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<ObjectAppRoutes routes={{ health: route }} format={format} onChangeRoutes={vi.fn()} disabled />);

    await user.click(await screen.findByRole('tab', { name: TabsI18nKey.Roles }));
    await screen.findByText('missing');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Actions }));
    await user.click(screen.getByText(ActionMenuOperationI18nKey.Open_in_new_tab));
    expect(windowOpen).toHaveBeenCalledWith('/platform-roles/missing', '_blank');
    windowOpen.mockRestore();
  });
});
