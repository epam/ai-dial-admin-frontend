import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MOUNT_TYPE, VALUE_TYPE } from '@/src/types/deployments/variables';
import { EntityPlaceholdersI18nKey } from '@/src/constants/i18n';

import Value from '@/src/components/Deployments/Fields/ContainerVariables/Value';

describe('EnvVariableValue', () => {
  const baseProps = {
    value: { $type: VALUE_TYPE.SIMPLE, value: 'test-value' },
    onValueChange: vi.fn(),
    index: 0,
    mountType: MOUNT_TYPE.CONTENT,
  };

  test('renders a text input for simple non-secure values', () => {
    render(<Value {...baseProps} />);

    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Value)).toHaveValue('test-value');
  });

  test('renders a password input for secure-content mount type', () => {
    const { container } = render(
      <Value
        {...baseProps}
        mountType={MOUNT_TYPE.SECURE_CONTENT}
        value={{ $type: VALUE_TYPE.SIMPLE, value: 'secret' }}
      />,
    );

    const input = container.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();
  });

  test('renders a file chip when value is file-typed', () => {
    render(
      <Value
        {...baseProps}
        mountType={MOUNT_TYPE.SECURE_FILE}
        value={{ $type: VALUE_TYPE.FILE, fileName: 'config.yaml', fileContent: 'aGVsbG8=' }}
      />,
    );

    expect(screen.getByText('config.yaml')).toBeInTheDocument();
  });

  test('does not render a file-upload button (button now lives in Variable)', () => {
    const { container } = render(<Value {...baseProps} />);

    const fileBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.querySelector('svg[class*="tabler-icon-file-arrow-right"]'),
    );
    expect(fileBtn).toBeUndefined();
  });

  test('does not render a hidden file input (input now lives in Variable)', () => {
    const { container } = render(<Value {...baseProps} />);

    expect(container.querySelector('input[type="file"]')).not.toBeInTheDocument();
  });

  test('renders a label only when fieldName is provided', () => {
    const { rerender } = render(<Value {...baseProps} />);
    expect(screen.queryByText('Basic.Value')).not.toBeInTheDocument();

    rerender(<Value {...baseProps} fieldName="Basic.Value" />);
    expect(screen.getByText('Basic.Value')).toBeInTheDocument();
  });
});
