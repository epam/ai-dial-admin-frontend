import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AliasI18nKey, EntityFieldsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { DialAliasResource } from '@/src/models/dial/alias';
import { AliasCreateStep } from '../constants';
import AliasCreateProperties from '../CreateProperties';

vi.mock('@/src/context/SaveValidationContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/context/SaveValidationContext')>()),
  useSaveValidationContext: () => ({ isValid: true, dispatch: vi.fn() }),
}));
vi.mock('@/src/hooks/use-is-read-only-admin', () => ({ useIsReadOnlyAdmin: () => false }));

// The target field has its own spec; here it only has to receive the entity's target and report a change.
vi.mock('../TargetField', () => ({
  default: ({
    target,
    presentAs,
    onChange,
  }: {
    target?: { path: string };
    presentAs?: string;
    onChange: (change: { target?: { path: string }; presentAs?: string }) => void;
  }) => (
    <div>
      <span>{`target:${target?.path ?? ''}:${presentAs ?? ''}`}</span>
      <button onClick={() => onChange({ target: { path: 'models/gpt' }, presentAs: 'application' })}>set-target</button>
    </div>
  ),
}));

describe('AliasCreateProperties', () => {
  const onChangeEntity = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderProperties = (
    entity: DialAliasResource = { name: '' },
    extra?: { externalError?: string; step?: AliasCreateStep },
  ) =>
    render(
      <AliasCreateProperties
        step={AliasCreateStep.Details}
        entity={entity}
        names={['taken']}
        onChangeEntity={onChangeEntity}
        {...extra}
      />,
    );
  const renderTargetStep = (entity: DialAliasResource) => renderProperties(entity, { step: AliasCreateStep.Target });

  const nameInput = () => screen.getByRole('textbox', { name: /EntityFields\.id/ });

  test('first step: the name, display name, display version and description, and no target', () => {
    renderProperties();

    expect(nameInput()).toBeTruthy();
    expect(screen.getByRole('textbox', { name: AliasI18nKey.DisplayVersion })).toBeTruthy();
    expect(screen.queryByText(/^target:/)).toBeNull();
  });

  test('marks the display name as required, since the step cannot be completed without it', () => {
    renderProperties();

    expect(screen.getByRole('textbox', { name: /EntityFields.displayName.*\(required\)/ })).toBeTruthy();
  });

  test('passes the display version up, and none at all when it is cleared', () => {
    renderProperties({ name: 'a', displayVersion: '1.0' });
    const version = screen.getByRole('textbox', { name: AliasI18nKey.DisplayVersion });

    fireEvent.change(version, { target: { value: '2.0' } });
    fireEvent.change(version, { target: { value: '' } });

    expect(onChangeEntity).toHaveBeenNthCalledWith(1, expect.objectContaining({ displayVersion: '2.0' }));
    expect(onChangeEntity).toHaveBeenNthCalledWith(2, expect.objectContaining({ displayVersion: undefined }));
  });

  test('passes the entity name change up', () => {
    renderProperties({ name: '' });

    fireEvent.change(nameInput(), { target: { value: 'assistant-v1' } });

    expect(onChangeEntity).toHaveBeenCalledWith(expect.objectContaining({ name: 'assistant-v1' }));
  });

  test('shows the invalid-name message for a character only Core restricts', () => {
    renderProperties({ name: 'a:b' });

    expect(screen.getByText(AliasI18nKey.NameInvalid)).toBeTruthy();
  });

  // The shared name validator speaks first for these, and its message blocks the form just the same.
  test.each([
    ['team/assistant', ErrorI18nKey.ForbiddenChars],
    ['with space', ErrorI18nKey.ContainSpace],
  ])('shows a validation error for "%s"', (name, key) => {
    renderProperties({ name });

    expect(screen.getByText(key)).toBeTruthy();
  });

  test('shows no invalid-name message for a name made of the allowed characters', () => {
    renderProperties({ name: 'assistant-v1.2_x' });

    expect(screen.queryByText(AliasI18nKey.NameInvalid)).toBeNull();
  });

  test('shows the error of the caller when the name itself is fine', () => {
    renderProperties({ name: 'assistant-v1' }, { externalError: 'already used' });

    expect(screen.getByText('already used')).toBeTruthy();
  });

  test('second step: only the target field, handed the target and presentation of the entity', () => {
    renderTargetStep({ name: 'a', target: { path: 'models/gpt' } });

    expect(screen.queryByRole('textbox', { name: AliasI18nKey.DisplayVersion })).toBeNull();
    expect(screen.getByText('target:models/gpt:')).toBeTruthy();
  });

  test('merges a target change into the entity without losing its name', () => {
    renderTargetStep({ name: 'assistant-v1' });

    fireEvent.click(screen.getByRole('button', { name: 'set-target' }));

    expect(onChangeEntity).toHaveBeenCalledWith({
      name: 'assistant-v1',
      target: { path: 'models/gpt' },
      presentAs: 'application',
    });
  });
});
