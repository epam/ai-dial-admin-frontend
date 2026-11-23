import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { AssetSource } from '@/src/models/dial/asset-source';
import SelectEntitiesPopup from '../SelectEntitiesPopup';
import { EntitySelectType, PickedEntity } from '../models';

const PICKED: PickedEntity = { source: AssetSource.Platform, name: 'assistant' };

// Stand-in for the picker: reports through whichever callback the popup hands it, as the real one does per mode.
vi.mock('../EntitySelectManager', () => ({
  default: ({
    onChangeSelectedEntities,
    onChangeSelectedEntity,
  }: {
    onChangeSelectedEntities?: (entities: PickedEntity[]) => void;
    onChangeSelectedEntity?: (entity: PickedEntity | null) => void;
  }) => (
    <div>
      <span>{onChangeSelectedEntity ? 'mode:single' : 'mode:multi'}</span>
      <button
        onClick={() => (onChangeSelectedEntity ? onChangeSelectedEntity(PICKED) : onChangeSelectedEntities?.([PICKED]))}
      >
        pick
      </button>
      <button onClick={() => (onChangeSelectedEntity ? onChangeSelectedEntity(null) : onChangeSelectedEntities?.([]))}>
        pick-none
      </button>
    </div>
  ),
}));

describe('SelectEntitiesPopup', () => {
  const onClose = vi.fn();
  const onApply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPopup = (props?: Partial<Parameters<typeof SelectEntitiesPopup>[0]>) =>
    render(
      <SelectEntitiesPopup
        entityType={EntitySelectType.Toolset}
        header="pick-header"
        isOpen
        onClose={onClose}
        onApply={onApply}
        {...props}
      />,
    );

  const applyButton = () => screen.getByRole('button', { name: ButtonsI18nKey.Apply });

  test('shows the given header over the picker', () => {
    renderPopup();

    expect(screen.getByText('pick-header')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'pick' })).toBeTruthy();
  });

  test('renders nothing when closed', () => {
    renderPopup({ isOpen: false });

    expect(screen.queryByText('pick-header')).toBeNull();
  });

  test('hands the multi callback to the picker by default', () => {
    renderPopup();

    expect(screen.getByText('mode:multi')).toBeTruthy();
  });

  test('hands the single callback to the picker in single mode', () => {
    renderPopup({ isSingle: true });

    expect(screen.getByText('mode:single')).toBeTruthy();
  });

  test('keeps Apply disabled until something is picked, in either mode', async () => {
    const user = userEvent.setup();
    renderPopup({ isSingle: true });

    expect(applyButton().hasAttribute('disabled')).toBe(true);
    await user.click(screen.getByRole('button', { name: 'pick' }));
    expect(applyButton().hasAttribute('disabled')).toBe(false);
    await user.click(screen.getByRole('button', { name: 'pick-none' }));
    expect(applyButton().hasAttribute('disabled')).toBe(true);
  });

  test('applies exactly one entity in single mode', async () => {
    const user = userEvent.setup();
    renderPopup({ isSingle: true });

    await user.click(screen.getByRole('button', { name: 'pick' }));
    await user.click(applyButton());

    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply).toHaveBeenCalledWith([PICKED]);
  });

  test('discards the pick on cancel so the next open starts empty', async () => {
    const user = userEvent.setup();
    renderPopup();

    await user.click(screen.getByRole('button', { name: 'pick' }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(onApply).not.toHaveBeenCalled();
    expect(applyButton().hasAttribute('disabled')).toBe(true);
  });
});
