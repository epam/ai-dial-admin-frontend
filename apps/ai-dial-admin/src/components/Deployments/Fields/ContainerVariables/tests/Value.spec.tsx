import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MOUNT_TYPE, VALUE_TYPE } from '@/src/types/deployments/variables';

import Value from '@/src/components/Deployments/Fields/ContainerVariables/Value';

describe('EnvVariableValue', () => {
  const defaultProps = {
    value: { $type: VALUE_TYPE.SIMPLE, value: 'test-value' },
    onValueChange: vi.fn(),
    index: 0,
    mountType: MOUNT_TYPE.CONTENT,
  };

  test('renders simple value input', () => {
    render(<Value {...defaultProps} />);

    expect(screen.getByDisplayValue('test-value')).toBeInTheDocument();
  });
});
