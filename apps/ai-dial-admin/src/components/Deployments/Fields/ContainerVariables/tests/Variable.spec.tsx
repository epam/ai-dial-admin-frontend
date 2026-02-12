import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Variable from '@/src/components/Deployments/Fields/ContainerVariables/Variable';
import { EnvironmentVariable } from '@/src/models/deployments/variables';
import { MOUNT_TYPE, VALUE_TYPE } from '@/src/types/deployments/variables';

describe('EnvVariable', () => {
  const mockVariable: EnvironmentVariable = {
    name: 'TEST_VAR',
    description: 'Test variable description',
    value: { $type: VALUE_TYPE.SIMPLE, value: 'test-value' },
    mountType: MOUNT_TYPE.CONTENT,
  };

  const mockUpdateVariable = vi.fn();
  const mockRemoveVariable = vi.fn();

  const defaultProps = {
    index: 0,
    numVariables: 2,
    variable: mockVariable,
    updateVariable: mockUpdateVariable,
    removeVariable: mockRemoveVariable,
  };

  test.skip('renders variable name input', () => {
    render(<Variable {...defaultProps} />);
    expect(screen.getByDisplayValue('TEST_VAR')).toBeInTheDocument();
  });

  test.skip('renders variable description input', () => {
    render(<Variable {...defaultProps} />);
    expect(screen.getByDisplayValue('Test variable description')).toBeInTheDocument();
  });

  test.skip('calls updateVariable when name changes', async () => {
    const user = userEvent.setup();
    render(<Variable {...defaultProps} />);

    const nameInput = screen.getByDisplayValue('TEST_VAR');
    await user.clear(nameInput);
    await user.type(nameInput, 'NEW_VAR');

    expect(mockUpdateVariable).toHaveBeenCalled();
  });

  test.skip('calls updateVariable when description changes', async () => {
    const user = userEvent.setup();
    render(<Variable {...defaultProps} />);

    const descInput = screen.getByDisplayValue('Test variable description');
    await user.clear(descInput);
    await user.type(descInput, 'New description');

    expect(mockUpdateVariable).toHaveBeenCalled();
  });

  test.skip('calls removeVariable when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<Variable {...defaultProps} />);

    const deleteButton = screen.getByRole('button', { name: /trash/i });
    await user.click(deleteButton);

    expect(mockRemoveVariable).toHaveBeenCalledWith(0);
  });

  test.skip('does not show delete button when only one empty variable', () => {
    const props = {
      ...defaultProps,
      numVariables: 1,
      variable: {} as EnvironmentVariable,
    };
    render(<Variable {...props} />);

    expect(screen.queryByRole('button', { name: /trash/i })).not.toBeInTheDocument();
  });

  test.skip('renders with empty variable', () => {
    const props = {
      ...defaultProps,
      variable: {} as EnvironmentVariable,
    };
    render(<Variable {...props} />);

    expect(screen.getByRole('button', { name: /trash/i })).toBeInTheDocument();
  });
});
