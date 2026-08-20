import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import Properties from '@/src/components/EntityMainProperties/Properties/Properties';
import { EntityFieldsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { ApplicationRoute } from '@/src/types/routes';

const NAME_LABEL = `${EntityFieldsI18nKey.name}*`;
const DESCRIPTION_LABEL = `${EntityFieldsI18nKey.description}*`;

const renderCreateForm = (
  onChangeEntity: (entity: object) => void,
  entity = { name: '', description: '' },
  names: string[] = [],
) => {
  render(
    <Properties
      view={ApplicationRoute.AssetsSkills}
      entity={entity}
      names={names}
      isModal
      onChangeEntity={onChangeEntity}
    />,
  );
  return { dispatch: useSaveValidationContext().dispatch };
};

/**
 * The create modal reaches this form through the shared `Properties` dispatcher, since Skill has no
 * version and doesn't fit the generic `AssetProperties` shape (same reason App Runner bypasses it).
 */
describe('Skill asset :: create form', () => {
  test('renders Name and Description fields', () => {
    renderCreateForm(vi.fn());

    expect(screen.getByRole('textbox', { name: NAME_LABEL })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: DESCRIPTION_LABEL })).toBeInTheDocument();
  });

  test('writes the typed value to name', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: NAME_LABEL }), { target: { value: 'my-skill' } });

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ name: 'my-skill' }));
  });

  test('rejects a name containing a space', () => {
    renderCreateForm(vi.fn());

    fireEvent.change(screen.getByRole('textbox', { name: NAME_LABEL }), { target: { value: 'my skill' } });

    expect(screen.getByText(ErrorI18nKey.ContainerId)).toBeInTheDocument();
  });

  test('rejects a name containing an uppercase letter', () => {
    renderCreateForm(vi.fn());

    fireEvent.change(screen.getByRole('textbox', { name: NAME_LABEL }), { target: { value: 'MySkill' } });

    expect(screen.getByText(ErrorI18nKey.ContainerId)).toBeInTheDocument();
  });

  test('accepts a name with only lowercase letters, digits, and hyphens', () => {
    renderCreateForm(vi.fn());

    fireEvent.change(screen.getByRole('textbox', { name: NAME_LABEL }), { target: { value: 'my-skill-2' } });

    expect(screen.queryByText(ErrorI18nKey.ContainerId)).not.toBeInTheDocument();
  });

  test('shows a duplicate-name error when the name matches an existing skill or folder', () => {
    renderCreateForm(vi.fn(), { name: '', description: '' }, ['my-skill']);

    fireEvent.change(screen.getByRole('textbox', { name: NAME_LABEL }), { target: { value: 'my-skill' } });

    expect(screen.getByText(ErrorI18nKey.SkillNameExists)).toBeInTheDocument();
  });

  test('marks the name field invalid while empty, without showing an error', () => {
    const { dispatch } = renderCreateForm(vi.fn());

    expect(dispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'name',
      isValid: false,
    });
    expect(screen.queryByText(ErrorI18nKey.ContainerId)).not.toBeInTheDocument();
  });

  test('writes the typed value to description', () => {
    const onChangeEntity = vi.fn();
    renderCreateForm(onChangeEntity);

    fireEvent.change(screen.getByRole('textbox', { name: DESCRIPTION_LABEL }), {
      target: { value: 'Does a thing' },
    });

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ description: 'Does a thing' }));
  });

  test('marks description invalid while empty and valid once entered', () => {
    const { dispatch } = renderCreateForm(vi.fn());

    expect(dispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'descriptionRequired',
      isValid: false,
    });

    fireEvent.change(screen.getByRole('textbox', { name: DESCRIPTION_LABEL }), {
      target: { value: 'Does a thing' },
    });

    expect(dispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'descriptionRequired',
      isValid: true,
    });
  });
});
