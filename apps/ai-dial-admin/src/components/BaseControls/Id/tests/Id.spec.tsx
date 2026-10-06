import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import IdControl from '@/src/components/BaseControls/Id/Id';

const StatefulExternalErrorIdControl = () => {
  const [entity, setEntity] = useState<{ name?: string }>({ name: 'existing-id' });
  const [externalError, setExternalError] = useState<string | undefined>('ID already exists');

  return (
    <IdControl
      entity={entity}
      externalError={externalError}
      onChangeEntity={(next) => {
        setEntity(next);
        setExternalError(void 0);
      }}
    />
  );
};

const StatefulIdControl = ({ onChange }: { onChange: (name?: string) => void }) => {
  const [entity, setEntity] = useState<{ name?: string }>({ name: '' });
  return (
    <IdControl
      entity={entity}
      isDeploymentId
      onChangeEntity={(next) => {
        setEntity(next);
        onChange(next.name);
      }}
    />
  );
};

describe('IdControl', () => {
  const { dispatch } = useSaveValidationContext();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders the id input', () => {
    render(<IdControl entity={{ name: '' }} isDeploymentId />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('registers the field as invalid on mount when the id is empty', () => {
    render(<IdControl entity={{ name: '' }} isDeploymentId />);

    expect(dispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'name',
      isValid: false,
    });
  });

  test('registers the field as valid on mount when the id is filled', () => {
    render(<IdControl entity={{ name: 'valid-id' }} isDeploymentId />);

    expect(dispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'name',
      isValid: true,
    });
  });

  test('renders and clears an external validation error after the value changes', async () => {
    const user = userEvent.setup();
    render(<StatefulExternalErrorIdControl />);

    expect(screen.getByText('ID already exists')).toBeInTheDocument();
    expect(dispatch).toHaveBeenCalledWith({
      type: ValidationActionType.SetField,
      field: 'name',
      isValid: false,
    });

    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'available-id');

    expect(screen.queryByText('ID already exists')).toBeNull();
    expect(dispatch).toHaveBeenLastCalledWith({
      type: ValidationActionType.SetField,
      field: 'name',
      isValid: true,
    });
  });

  test('validates and propagates changes as the user types a valid id', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StatefulIdControl onChange={onChange} />);

    await user.type(screen.getByRole('textbox'), 'valid-id');

    expect(onChange).toHaveBeenLastCalledWith('valid-id');
    expect(dispatch).toHaveBeenLastCalledWith({
      type: ValidationActionType.SetField,
      field: 'name',
      isValid: true,
    });
  });
});
