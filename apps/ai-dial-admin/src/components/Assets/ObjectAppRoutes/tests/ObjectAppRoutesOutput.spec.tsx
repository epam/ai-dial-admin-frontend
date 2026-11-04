import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import ObjectAppRoutes from '@/src/components/Assets/ObjectAppRoutes/ObjectAppRoutes';
import {
  ObjectAppRouteFormat,
  ObjectAppRoutes as ObjectAppRoutesModel,
} from '@/src/components/Assets/ObjectAppRoutes/models';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';

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
});
