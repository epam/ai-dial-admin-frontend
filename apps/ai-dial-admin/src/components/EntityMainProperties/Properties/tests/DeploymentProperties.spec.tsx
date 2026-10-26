import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import DeploymentProperties from '../DeploymentProperties';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityFieldsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { ChatEntity } from '@/src/models/dial/base-entity';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

vi.mock('@/src/app/[lang]/models/actions', () => ({
  getModelsAdapters: vi.fn(),
}));

vi.mock('@/src/app/actions/deployments', () => ({
  getMCPContainers: vi.fn(),
  getModelContainers: vi.fn(),
  getToolsetContainers: vi.fn(),
  getApplicationContainers: vi.fn(),
}));

describe('DeploymentProperties', () => {
  test('does not show duplicate ID error when names list uses display names not deployment ids', () => {
    render(
      <DeploymentProperties
        view={ApplicationRoute.Models}
        entity={{ name: 'my-deployment-id', displayName: '', description: '' }}
        names={['Other Model___1.0.0']}
        onChangeEntity={vi.fn()}
      />,
    );

    expect(screen.queryByText(ErrorI18nKey.NameExists)).not.toBeInTheDocument();
  });

  test('shows duplicate ID error when backend reports non-unique name', () => {
    render(
      <DeploymentProperties
        view={ApplicationRoute.Models}
        entity={{ name: 'existing-model', displayName: '', description: '' }}
        names={['existing-model']}
        isUniqueNameError
        onChangeEntity={vi.fn()}
      />,
    );

    expect(screen.getByText(ErrorI18nKey.NameExists)).toBeInTheDocument();
  });

  test('renders an intro field alongside description', () => {
    render(
      <DeploymentProperties
        view={ApplicationRoute.Models}
        entity={{ name: 'my-deployment-id', displayName: '', description: '', intro: '' }}
        names={[]}
        onChangeEntity={vi.fn()}
      />,
    );

    expect(screen.getByText(EntityFieldsI18nKey.intro)).toBeInTheDocument();
  });

  test('hides the intro field in a create popup', () => {
    render(
      <DeploymentProperties
        view={ApplicationRoute.Models}
        entity={{ name: 'my-deployment-id', displayName: '', description: '', intro: '' }}
        names={[]}
        onChangeEntity={vi.fn()}
        isModal
      />,
    );

    expect(screen.queryByText(EntityFieldsI18nKey.intro)).not.toBeInTheDocument();
  });
});

describe('DeploymentProperties — display name', () => {
  const ControlledProperties = ({ onChangeEntity }: { onChangeEntity: (entity: ChatEntity) => void }) => {
    const [entity, setEntity] = useState<ChatEntity>({ name: 'my-deployment-id', displayName: '', description: '' });
    return (
      <DeploymentProperties
        view={ApplicationRoute.Toolsets}
        entity={entity}
        names={['Beta tool', 'Alpha tool', 'Alpha tool']}
        onChangeEntity={(next) => {
          setEntity(next);
          onChangeEntity(next);
        }}
        isModal
      />
    );
  };

  const renderDisplayName = () => {
    const onChangeEntity = vi.fn();
    const user = userEvent.setup();
    render(<ControlledProperties onChangeEntity={onChangeEntity} />);
    return {
      user,
      onChangeEntity,
      input: screen.getByRole('combobox', { name: new RegExp(EntityFieldsI18nKey.displayName) }),
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(false);
  });

  test('accepts a typed name that is not one of the existing names', async () => {
    const { user, onChangeEntity, input } = renderDisplayName();

    await user.type(input, 'My test model');

    expect(onChangeEntity).toHaveBeenLastCalledWith(expect.objectContaining({ displayName: 'My test model' }));
    expect((input as HTMLInputElement).value).toBe('My test model');
  });

  test('offers the existing names sorted and without duplicates on focus', async () => {
    const { user, input } = renderDisplayName();

    await user.click(input);

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Alpha tool', 'Beta tool']);
  });

  test('sets a picked existing name and validates it', async () => {
    const { user, onChangeEntity, input } = renderDisplayName();

    await user.click(input);
    await user.click(screen.getByRole('option', { name: 'Beta tool' }));

    expect(onChangeEntity).toHaveBeenLastCalledWith(expect.objectContaining({ displayName: 'Beta tool' }));
    expect(screen.getByText(ErrorI18nKey.DisplayNameExists)).toBeInTheDocument();
  });

  test('blocks Save while the field is cleared, without leaving it', async () => {
    const { user, input } = renderDisplayName();
    const { dispatch } = useSaveValidationContext();

    await user.type(input, 'ab');
    await user.clear(input);

    expect(screen.getByText(ErrorI18nKey.MinMaxLength)).toBeInTheDocument();
    expect(dispatch).toHaveBeenLastCalledWith({
      type: ValidationActionType.SetField,
      field: 'displayName',
      isValid: false,
    });
    expect(document.activeElement).toBe(input);
  });

  test('disables the field for a read-only admin', () => {
    vi.mocked(useIsReadOnlyAdmin).mockReturnValue(true);
    const { input } = renderDisplayName();

    expect(input).toBeDisabled();
  });
});
