import { saveValidationMock } from '@/test-mocks/save-validation';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { EntitySelectType, PickedEntity } from '@/src/components/Common/EntitySelectInput/models';
import { AliasI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { AliasPresentAs, AliasTargetType } from '@/src/models/dial/alias';
import { AssetSource } from '@/src/models/dial/asset-source';
import TargetField from '../TargetField';

const { dispatch } = saveValidationMock;

// Stand-in for the picker popup: exposes which entity type it was opened for and applies a fixed pick.
const PICKED: PickedEntity = {
  source: AssetSource.Public,
  name: 'public/team/assistant',
  path: 'public/team/assistant',
};
vi.mock('@/src/components/Common/EntitySelectInput/SelectEntitiesPopup', () => ({
  default: ({
    entityType,
    header,
    isSingle,
    onApply,
    onClose,
  }: {
    entityType: EntitySelectType;
    header: string;
    isSingle?: boolean;
    onApply: (entities: PickedEntity[]) => void;
    onClose: () => void;
  }) => (
    <div role="dialog" aria-label={header}>
      <span>{`picker:${entityType}:${isSingle ? 'single' : 'multi'}`}</span>
      <button onClick={() => onApply([PICKED])}>apply-pick</button>
      <button onClick={() => onApply([])}>apply-nothing</button>
      <button onClick={onClose}>close-picker</button>
    </div>
  ),
}));

describe('TargetField', () => {
  const onChange = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderField = (props?: Partial<Parameters<typeof TargetField>[0]>) =>
    render(<TargetField isModal onChange={onChange} {...props} />);

  const typeSelect = () => screen.getByRole('combobox', { name: new RegExp(AliasI18nKey.TargetType) });
  const presentAsSelect = () => screen.getByRole('combobox', { name: new RegExp(AliasI18nKey.PresentAs) });

  test('starts on the Application target type when there is no target yet', () => {
    renderField();

    expect(typeSelect()).toHaveAccessibleName(new RegExp(AliasI18nKey.TargetTypeApplication));
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Open })).toBeTruthy();
  });

  test('reads the target type from an existing target and offers to change the target', () => {
    renderField({ target: { path: 'toolsets/public/search' } });

    expect(typeSelect()).toHaveAccessibleName(new RegExp(AliasI18nKey.TargetTypeToolset));
    expect(screen.getByRole('textbox', { name: new RegExp(AliasI18nKey.Target) })).toHaveProperty(
      'value',
      'toolsets/public/search',
    );
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Open })).toBeTruthy();
  });

  test('shows an encoded target readably', () => {
    renderField({ target: { path: 'applications/public/QA/Code%20Apps%20ALS/app__1.0.0' } });

    expect(screen.getByRole('textbox', { name: new RegExp(AliasI18nKey.Target) })).toHaveProperty(
      'value',
      'applications/public/QA/Code Apps ALS/app__1.0.0',
    );
  });

  test('opens the single-selection picker for the chosen target type', async () => {
    renderField({ target: { path: 'models/gpt' } });

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Open }));

    expect(screen.getByText(`picker:${EntitySelectType.Model}:single`)).toBeTruthy();
    expect(screen.getByRole('dialog', { name: AliasI18nKey.SelectModelTarget })).toBeTruthy();
  });

  test('writes the picked entity as the target path of the chosen type', async () => {
    renderField();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Open }));
    await user.click(screen.getByRole('button', { name: 'apply-pick' }));

    expect(onChange).toHaveBeenCalledWith({
      target: { path: 'applications/public/team/assistant' },
      presentAs: undefined,
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('keeps the target when the picker is applied with nothing', async () => {
    renderField({ target: { path: 'models/gpt' } });

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Open }));
    await user.click(screen.getByRole('button', { name: 'apply-nothing' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  test('closes the picker without writing anything', async () => {
    renderField();

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Open }));
    await user.click(screen.getByRole('button', { name: 'close-picker' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('clears the target when the target type changes, keeping a presentation that still fits', async () => {
    renderField({ target: { path: 'models/gpt' }, presentAs: AliasPresentAs.Application });

    await user.click(typeSelect());
    await user.click(screen.getByRole('option', { name: AliasI18nKey.TargetTypeApplication }));

    expect(onChange).toHaveBeenCalledWith({ target: undefined, presentAs: undefined });
  });

  test('drops a presentation the new target type does not allow', async () => {
    renderField({ target: { path: 'applications/public/x' }, presentAs: AliasPresentAs.Model });

    await user.click(typeSelect());
    await user.click(screen.getByRole('option', { name: AliasI18nKey.TargetTypeToolset }));

    expect(onChange).toHaveBeenCalledWith({ target: undefined, presentAs: undefined });
  });

  test.each([
    ['models/gpt', [AliasI18nKey.PresentAsModel, AliasI18nKey.PresentAsApplication]],
    [
      'applications/public/x',
      [AliasI18nKey.PresentAsApplication, AliasI18nKey.PresentAsModel, AliasI18nKey.PresentAsToolset],
    ],
    ['toolsets/public/x', [AliasI18nKey.PresentAsToolset]],
    ['routers/r', [AliasI18nKey.PresentAsRouter, AliasI18nKey.PresentAsModel, AliasI18nKey.PresentAsApplication]],
  ])('offers only the presentations a %s target allows', async (path, labels) => {
    renderField({ target: { path } });

    await user.click(presentAsSelect());

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(labels);
  });

  test('shows the default presentation of the target type when none is stored', () => {
    renderField({ target: { path: 'toolsets/public/x' } });

    expect(presentAsSelect()).toHaveAccessibleName(new RegExp(AliasI18nKey.PresentAsToolset));
  });

  test('does not store a presentation equal to the default, and stores a different one', async () => {
    renderField({ target: { path: 'applications/public/x' } });

    await user.click(presentAsSelect());
    await user.click(screen.getByRole('option', { name: AliasI18nKey.PresentAsToolset }));

    expect(onChange).toHaveBeenCalledWith({
      target: { path: 'applications/public/x' },
      presentAs: AliasPresentAs.Toolset,
    });
  });

  test('shows a target it cannot read as text and leaves it unchanged', () => {
    renderField({ target: { path: 'aliases/public/other' } });

    expect(screen.getByRole('textbox', { name: new RegExp(AliasI18nKey.Target) })).toHaveProperty(
      'value',
      'aliases/public/other',
    );
    expect(screen.getByText(AliasI18nKey.UnparsableTarget)).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
  });

  test('marks the target field invalid until a target is chosen, then valid', () => {
    const { rerender } = renderField();

    expect(dispatch).toHaveBeenLastCalledWith(expect.objectContaining({ field: 'target', isValid: false }));

    rerender(<TargetField isModal target={{ path: 'models/gpt' }} onChange={onChange} />);

    expect(dispatch).toHaveBeenLastCalledWith(expect.objectContaining({ field: 'target', isValid: true }));
  });

  test('offers no way to change a read-only target', () => {
    renderField({ target: { path: 'models/gpt' }, isReadOnly: true });

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Open })).toBeNull();
    expect(typeSelect().hasAttribute('disabled') || typeSelect().getAttribute('aria-disabled') === 'true').toBe(true);
  });

  test('opens the router picker for a router target', async () => {
    renderField({ target: { path: 'routers/old' } });

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Open }));

    expect(screen.getByText(`picker:${EntitySelectType.Router}:single`)).toBeTruthy();
    expect(screen.getByRole('dialog', { name: AliasI18nKey.SelectRouterTarget })).toBeTruthy();
  });

  test('shows a router target with the router presentation by default', () => {
    renderField({ target: { path: 'routers/r' } });

    expect(typeSelect()).toHaveAccessibleName(new RegExp(AliasI18nKey.TargetTypeRouter));
    expect(presentAsSelect()).toHaveAccessibleName(new RegExp(AliasI18nKey.PresentAsRouter));
    expect(screen.getByRole('textbox', { name: new RegExp(AliasI18nKey.Target) })).toHaveValue('routers/r');
    expect(onChange).not.toHaveBeenCalled();
  });

  test('offers the router target type on a Platform alias', async () => {
    renderField();

    await user.click(typeSelect());

    expect(screen.getByRole('option', { name: AliasI18nKey.TargetTypeRouter })).toBeTruthy();
  });

  test('does not offer the router target type on a Public alias', async () => {
    renderField({ isPublic: true });

    await user.click(typeSelect());

    expect(screen.queryByRole('option', { name: AliasI18nKey.TargetTypeRouter })).toBeNull();
  });

  test('keeps a stored router target type listed on a Public alias', async () => {
    renderField({ isPublic: true, target: { path: 'routers/r' } });

    await user.click(typeSelect());

    expect(screen.getByRole('option', { name: AliasI18nKey.TargetTypeRouter })).toBeTruthy();
  });

  test('is typed over the four target types', () => {
    expect(Object.values(AliasTargetType)).toHaveLength(4);
  });
});
