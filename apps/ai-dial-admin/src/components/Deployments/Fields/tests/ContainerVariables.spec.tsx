import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MOUNT_TYPE, VALUE_TYPE } from '@/src/types/deployments/variables';
import { BasicI18nKey, EntityPlaceholdersI18nKey, EnvVariablesI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import ContainerVariables from '@/src/components/Deployments/Fields/ContainerVariables';

describe('EnvVariables', () => {
  const emptyContainer = { metadata: {} } as Container;

  const buildContainer = (count: number) =>
    ({
      metadata: {
        envs: Array.from({ length: count }, (_, i) => ({
          name: `VAR${i + 1}`,
          description: `Desc ${i + 1}`,
          value: { $type: VALUE_TYPE.SIMPLE, value: `val${i + 1}` },
          mountType: MOUNT_TYPE.CONTENT,
        })),
      },
    }) as Container;

  test('renders the add-variable button', () => {
    render(<ContainerVariables container={emptyContainer} setContainer={vi.fn()} />);

    expect(screen.getByRole('button', { name: EnvVariablesI18nKey.AddVariable })).toBeInTheDocument();
  });

  test('renders variables from container metadata', () => {
    render(<ContainerVariables setContainer={vi.fn()} container={buildContainer(1)} />);

    expect(screen.getByDisplayValue('VAR1')).toBeInTheDocument();
  });

  test('does not render the column header row when no variables exist', () => {
    render(<ContainerVariables container={emptyContainer} setContainer={vi.fn()} />);

    expect(screen.queryByText(EnvVariablesI18nKey.Name)).not.toBeInTheDocument();
    expect(screen.queryByText(EnvVariablesI18nKey.Description)).not.toBeInTheDocument();
    expect(screen.queryByText(BasicI18nKey.Value)).not.toBeInTheDocument();
    expect(screen.queryByText(EnvVariablesI18nKey.MountType)).not.toBeInTheDocument();
  });

  test('renders exactly one column header row when at least one variable exists', () => {
    render(<ContainerVariables container={buildContainer(1)} setContainer={vi.fn()} />);

    expect(screen.getAllByText(EnvVariablesI18nKey.Name)).toHaveLength(1);
    expect(screen.getAllByText(EnvVariablesI18nKey.Description)).toHaveLength(1);
    expect(screen.getAllByText(BasicI18nKey.Value)).toHaveLength(1);
    expect(screen.getAllByText(EnvVariablesI18nKey.MountType)).toHaveLength(1);
  });

  test('column header row is not duplicated when multiple variables exist', () => {
    render(<ContainerVariables container={buildContainer(3)} setContainer={vi.fn()} />);

    expect(screen.getAllByText(EnvVariablesI18nKey.Name)).toHaveLength(1);
    expect(screen.getAllByText(EnvVariablesI18nKey.Description)).toHaveLength(1);
    expect(screen.getAllByText(BasicI18nKey.Value)).toHaveLength(1);
    expect(screen.getAllByText(EnvVariablesI18nKey.MountType)).toHaveLength(1);

    // All three variable inputs are still in the document
    expect(screen.getAllByPlaceholderText(EntityPlaceholdersI18nKey.Name)).toHaveLength(3);
  });

  test('shows duplicate name error when adding a variable with an existing name', () => {
    const initialVariables = [
      {
        name: 'DATABASE_URL',
        description: '',
        value: { $type: VALUE_TYPE.SIMPLE, value: 'val1' },
        mountType: MOUNT_TYPE.CONTENT,
      },
    ];

    let currentContainer = { metadata: { envs: initialVariables } } as Container;
    const setContainer = vi.fn((updated: Container) => {
      currentContainer = updated;
    });

    const { rerender } = render(<ContainerVariables container={currentContainer} setContainer={setContainer} />);

    fireEvent.click(screen.getByRole('button', { name: EnvVariablesI18nKey.AddVariable }));
    expect(setContainer).toHaveBeenCalled();
    rerender(<ContainerVariables container={currentContainer} setContainer={setContainer} />);

    const nameInputs = screen.getAllByPlaceholderText(EntityPlaceholdersI18nKey.Name);
    expect(nameInputs).toHaveLength(2);
    const newNameInput = nameInputs[nameInputs.length - 1];
    fireEvent.change(newNameInput, { target: { value: 'DATABASE_URL' } });

    expect(screen.getByText(EnvVariablesI18nKey.DuplicateName)).toBeInTheDocument();
  });
});
