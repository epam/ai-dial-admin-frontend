import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { AliasPresentAs, DialAliasResource } from '@/src/models/dial/alias';
import AliasTargetTab from '../Target';

const readOnly = vi.hoisted(() => ({ value: false }));

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({ useIsReadOnlyAdmin: () => readOnly.value }));
vi.mock('@/src/components/Common/KeyValueGrid/KeyValueGrid', () => ({
  default: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value?: Record<string, string>;
    onChange: (value: Record<string, string>) => void;
  }) => (
    <div>
      <span>{`${label}:${JSON.stringify(value ?? {})}`}</span>
      <button onClick={() => onChange({ 'X-Team': 'b' })}>change-headers</button>
    </div>
  ),
}));
vi.mock('../../TargetField', () => ({
  default: ({
    target,
    presentAs,
    isPublic,
    isReadOnly,
    onChange,
  }: {
    target?: { path: string };
    presentAs?: string;
    isPublic?: boolean;
    isReadOnly?: boolean;
    onChange: (change: { target?: { path: string }; presentAs?: string }) => void;
  }) => (
    <div>
      <span>{`target:${target?.path ?? ''}:${presentAs ?? ''}:${String(!!isReadOnly)}`}</span>
      <span>{`public:${String(!!isPublic)}`}</span>
      <button onClick={() => onChange({ target: { path: 'toolsets/public/search' }, presentAs: 'toolset' })}>
        change-target
      </button>
      <button onClick={() => onChange({ target: { path: 'models/other' }, presentAs: undefined })}>
        change-model-target
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

  test('tells the target field whether the alias is a Public one', () => {
    const { rerender } = render(<AliasTargetTab asset={alias} onChange={onChange} />);

    expect(screen.getByText('public:false')).toBeTruthy();

    rerender(<AliasTargetTab isPublic asset={alias} onChange={onChange} />);

    expect(screen.getByText('public:true')).toBeTruthy();
  });

  test('edits the default headers of an alias that is not a toolset', async () => {
    render(<AliasTargetTab asset={{ ...alias, defaultHeaders: { 'X-Team': 'a' } }} onChange={onChange} />);

    expect(screen.getByText(`${EntityFieldsI18nKey.defaultHeaders}:{"X-Team":"a"}`)).toBeTruthy();

    await userEvent.setup().click(screen.getByRole('button', { name: 'change-headers' }));

    expect(onChange).toHaveBeenCalledWith({ ...alias, defaultHeaders: { 'X-Team': 'b' } });
  });

  test('offers no default headers on a toolset alias', () => {
    render(<AliasTargetTab asset={{ target: { path: 'toolsets/public/search' } }} onChange={onChange} />);

    expect(screen.queryByRole('button', { name: 'change-headers' })).toBeNull();
  });

  test('drops the default headers when the alias becomes a toolset', async () => {
    render(<AliasTargetTab asset={{ ...alias, defaultHeaders: { 'X-Team': 'a' } }} onChange={onChange} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'change-target' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ presentAs: 'toolset', defaultHeaders: undefined }));
  });

  test('keeps the default headers on a target change that still sends them', async () => {
    render(<AliasTargetTab asset={{ ...alias, defaultHeaders: { 'X-Team': 'a' } }} onChange={onChange} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'change-model-target' }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: { path: 'models/other' }, defaultHeaders: { 'X-Team': 'a' } }),
    );
  });

  test('tells the target field it is read-only for a read-only admin', () => {
    readOnly.value = true;

    render(<AliasTargetTab asset={alias} onChange={onChange} />);

    expect(screen.getByText('target:models/gpt:application:true')).toBeTruthy();
  });
});
