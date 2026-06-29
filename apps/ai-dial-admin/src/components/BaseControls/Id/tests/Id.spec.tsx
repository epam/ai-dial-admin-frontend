import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import IdControl from '@/src/components/BaseControls/Id/Id';

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
