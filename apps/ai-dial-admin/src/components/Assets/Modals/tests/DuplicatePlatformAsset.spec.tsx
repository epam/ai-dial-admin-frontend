import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { PlatformAsset } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import DuplicatePlatformAsset from '../DuplicatePlatformAsset';

const model = { name: 'gpt-4', displayName: 'GPT-4', endpoint: 'http://model/chat' } as PlatformAsset;
const runner = {
  $id: 'http://runner/schema',
  'dial:applicationTypeDisplayName': 'Runner',
} as unknown as PlatformAsset;

const renderModal = (view: ApplicationRoute, entity: PlatformAsset, onDuplicate = vi.fn(), onClose = vi.fn()) => {
  render(
    <DuplicatePlatformAsset
      view={view}
      isModalOpen
      names={[]}
      entity={entity}
      onClose={onClose}
      onDuplicate={onDuplicate}
    />,
  );

  return { onDuplicate, onClose };
};

describe('DuplicatePlatformAsset', () => {
  test('Should offer only an id and a display name, these assets having no version or folder', () => {
    renderModal(ApplicationRoute.PlatformModels, model);

    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  test('Should suffix the model id without brackets, which Core rejects in a resource name', () => {
    renderModal(ApplicationRoute.PlatformModels, model);

    expect(screen.getAllByRole('textbox')[0]).toHaveValue('gpt-4-copy');
  });

  test('Should duplicate a model under the edited name', async () => {
    const user = userEvent.setup();
    const { onDuplicate } = renderModal(ApplicationRoute.PlatformModels, model);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

    expect(onDuplicate).toHaveBeenCalledWith({ ...model, name: 'gpt-4-copy' });
  });

  test('Should edit an app runner through its $id, not its name', async () => {
    const user = userEvent.setup();
    const { onDuplicate } = renderModal(ApplicationRoute.PlatformAppRunners, runner);
    const idInput = screen.getAllByRole('textbox')[0];

    expect(idInput).toHaveValue('http://runner/schema-copy');

    fireEvent.change(idInput, { target: { value: 'http://runner/other' } });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Duplicate }));

    expect(onDuplicate).toHaveBeenCalledWith({ ...runner, $id: 'http://runner/other' });
  });

  test('Should close without duplicating on cancel', async () => {
    const user = userEvent.setup();
    const { onDuplicate, onClose } = renderModal(ApplicationRoute.PlatformModels, model);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

    expect(onClose).toHaveBeenCalled();
    expect(onDuplicate).not.toHaveBeenCalled();
  });

  test('Should render a name field and a display name field for an app runner', () => {
    renderModal(ApplicationRoute.PlatformAppRunners, runner);

    expect(screen.getAllByRole('textbox')).toHaveLength(2);
  });

  test('Should render only a name field for a route, which has no displayName', () => {
    const route = { name: 'my-route' } as PlatformAsset;
    renderModal(ApplicationRoute.PlatformRoutes, route);

    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  test('Should render only a name field for a role, which has no displayName', () => {
    const role = { name: 'admin-role' } as PlatformAsset;
    renderModal(ApplicationRoute.PlatformRoles, role);

    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });
});
