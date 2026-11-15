import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AliasPresentAs, DialAliasResource } from '@/src/models/dial/alias';
import AliasTargetTab from '../Target';

const readOnly = vi.hoisted(() => ({ value: false }));

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({ useIsReadOnlyAdmin: () => readOnly.value }));
vi.mock('../../TargetField', () => ({
  default: ({
    target,
    presentAs,
    isReadOnly,
    onChange,
  }: {
    target?: { path: string };
    presentAs?: string;
    isReadOnly?: boolean;
    onChange: (change: { target?: { path: string }; presentAs?: string }) => void;
  }) => (
    <div>
      <span>{`target:${target?.path ?? ''}:${presentAs ?? ''}:${String(!!isReadOnly)}`}</span>
      <button onClick={() => onChange({ target: { path: 'toolsets/public/search' }, presentAs: 'toolset' })}>
        change-target
      </button>
    </div>
  ),
}));

const alias: DialAliasResource = {
  name: 'assistant-v1',
  displayName: 'Assistant',
  userRoles: ['admin'],
  target: { path: 'models/gpt' },
  presentAs: AliasPresentAs.Application,
};

describe('AliasTargetTab', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    readOnly.value = false;
  });

  test('hands the target and presentation to the target field', () => {
    render(<AliasTargetTab asset={alias} onChange={onChange} />);

    expect(screen.getByText('target:models/gpt:application:false')).toBeTruthy();
  });

  test('merges a target change into the alias without losing anything else', async () => {
    render(<AliasTargetTab asset={alias} onChange={onChange} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'change-target' }));

    expect(onChange).toHaveBeenCalledWith({
      ...alias,
      target: { path: 'toolsets/public/search' },
      presentAs: 'toolset',
    });
  });

  test('tells the target field it is read-only for a read-only admin', () => {
    readOnly.value = true;

    render(<AliasTargetTab asset={alias} onChange={onChange} />);

    expect(screen.getByText('target:models/gpt:application:true')).toBeTruthy();
  });
});
