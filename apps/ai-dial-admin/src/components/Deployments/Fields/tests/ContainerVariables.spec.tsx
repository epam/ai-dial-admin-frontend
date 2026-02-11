import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MOUNT_TYPE, VALUE_TYPE } from '@/src/types/deployments/variables';
import { EnvVariablesI18nKey } from '@/src/constants/i18n';
import { Container } from '@/src/models/deployments/containers';
import ContainerVariables from '@/src/components/Deployments/Fields/ContainerVariables';

describe('EnvVariables', () => {
  const container = { metadata: {} } as Container;

  test('renders component', () => {
    render(<ContainerVariables container={container} setContainer={vi.fn()} />);

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
    const container = { metadata: { envs: variables } } as Container;
    render(<ContainerVariables setContainer={vi.fn()} container={container} />);

    expect(screen.getByDisplayValue('VAR1')).toBeInTheDocument();
  });
});
