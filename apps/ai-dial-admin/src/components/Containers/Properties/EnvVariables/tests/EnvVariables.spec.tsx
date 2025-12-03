import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EnvVariables from '../EnvVariables';
import { MOUNT_TYPE, VALUE_TYPE } from '@/src/types/deployments/variables';
import { EnvVariablesI18nKey } from '@/src/constants/i18n';

describe('EnvVariables', () => {
  const defaultProps = {
    variables: [],
    updateVariables: vi.fn(),
  };

  test('renders component', () => {
    render(<EnvVariables variables={[]} onChangeVariables={vi.fn()} />);

    expect(screen.getByRole('button', { name: EnvVariablesI18nKey.AddVariable })).toBeInTheDocument();
  });

  test('renders with variables', () => {
    const variables = [
      {
        name: 'VAR1',
        description: 'Desc 1',
        value: { $type: VALUE_TYPE.SIMPLE, value: 'val1' },
        mountType: MOUNT_TYPE.CONTENT,
      },
    ];
    render(<EnvVariables onChangeVariables={vi.fn()} variables={variables} />);

    expect(screen.getByDisplayValue('VAR1')).toBeInTheDocument();
  });
});
