import { ComponentProps, ReactNode } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JSONSchema7 } from 'json-schema';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { BasicI18nKey, ButtonsI18nKey, JsonAtaI18nKey } from '@/src/constants/i18n';
import { MAX_JSONATA_EXPRESSION_SYMBOLS } from '@/src/constants/validation';
import { JsonataVariable } from '@/src/models/jsonata';
import JsonAtaInput from '../JsonAtaInput';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let capturedEditorProps: any;

vi.mock('@/src/components/Common/InputPopup/InputPopup', () => ({
  default: ({
    children,
    selectedValue,
    onOpen,
  }: {
    children?: ReactNode;
    selectedValue?: string;
    onOpen?: () => void;
  }) => (
    <div>
      <button type="button" onClick={onOpen}>
        {selectedValue}
      </button>
      {children}
    </div>
  ),
}));

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({ useIsReadOnlyAdmin: () => false }));

vi.mock('@/src/components/Common/JsonataEditor/JsonataEditor', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) => {
    capturedEditorProps = props;
    return (
      <textarea
        aria-label={props.options?.ariaLabel}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
    );
  },
}));

const responseSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    usage: { type: 'object', properties: { total_tokens: { type: 'integer' } } },
  },
};

const SAVED = 'saved.path';

const rowButton = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) });

describe('JsonAtaInput', () => {
  const onChangeValue = vi.fn();

  const renderInput = (props?: Partial<ComponentProps<typeof JsonAtaInput>>) => {
    render(<JsonAtaInput value={SAVED} responseSchema={responseSchema} onChangeValue={onChangeValue} {...props} />);
    return userEvent.setup();
  };

  const openPopup = (user: ReturnType<typeof userEvent.setup>) =>
    user.click(screen.getByRole('button', { name: SAVED }));

  beforeEach(() => {
    vi.clearAllMocks();
    capturedEditorProps = undefined;
  });

  test('keeps the popup closed until the field is opened', () => {
    renderInput();

    expect(screen.queryByRole('textbox')).toBeNull();
  });

  test('shows the saved expression in the editor next to the reference fields tree when opened', async () => {
    const user = renderInput();

    await openPopup(user);

    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(SAVED);
    expect(screen.getByText(JsonAtaI18nKey.ReferenceFields)).toBeTruthy();
    expect(rowButton('usage')).toBeTruthy();
  });

  test('hands the column variables to the editor', async () => {
    const variables: JsonataVariable[] = [{ name: 'request', description: 'Previous request' }];
    const user = renderInput({ variables });

    await openPopup(user);

    expect(capturedEditorProps.variables).toBe(variables);
  });

  test('turns the editor hints off', async () => {
    const user = renderInput();

    await openPopup(user);

    expect(capturedEditorProps.options).toMatchObject({
      quickSuggestions: false,
      suggestOnTriggerCharacters: false,
      wordBasedSuggestions: 'off',
      parameterHints: { enabled: false },
      hover: { enabled: false },
    });
  });

  test('replaces the editor text with the picked node path and applies it with the node type', async () => {
    const user = renderInput();
    await openPopup(user);

    await user.click(rowButton('usage'));
    await user.click(rowButton('total_tokens'));

    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('usage.total_tokens');

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Apply }));

    expect(onChangeValue).toHaveBeenCalledWith('usage.total_tokens', 'INTEGER');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  test('applies a typed expression without a data type, even after a node was picked', async () => {
    const user = renderInput();
    await openPopup(user);

    await user.click(rowButton('id'));
    await user.type(screen.getByRole('textbox'), 'x');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Apply }));

    expect(onChangeValue).toHaveBeenCalledWith('idx', undefined);
  });

  test('disables Apply while the expression is empty', async () => {
    const user = renderInput();
    await openPopup(user);

    await user.clear(screen.getByRole('textbox'));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Apply }).hasAttribute('disabled')).toBe(true);
  });

  test('blocks Apply and shows an error while the expression exceeds the max length', async () => {
    const user = renderInput({ value: 'a'.repeat(MAX_JSONATA_EXPRESSION_SYMBOLS) });
    await user.click(rowButton('a'));

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Apply }).hasAttribute('disabled')).toBe(false);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'a'.repeat(MAX_JSONATA_EXPRESSION_SYMBOLS + 1) },
    });

    expect(screen.getByRole('alert').textContent).toContain(BasicI18nKey.FieldValueTooLong);
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Apply }).hasAttribute('disabled')).toBe(true);
  });

  test('discards the draft on Cancel and reopens with the saved expression', async () => {
    const user = renderInput();
    await openPopup(user);

    await user.type(screen.getByRole('textbox'), '.more');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

    expect(onChangeValue).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).toBeNull();

    await openPopup(user);

    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(SAVED);
  });

  test('starts every opening with the panel expanded and no row selected', async () => {
    const user = renderInput();
    await openPopup(user);

    await user.click(rowButton('id'));
    await user.click(screen.getByRole('button', { name: JsonAtaI18nKey.CollapseReferenceFields }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));
    await openPopup(user);

    expect(screen.queryByRole('button', { name: JsonAtaI18nKey.ExpandReferenceFields })).toBeNull();
    expect(
      screen.getAllByRole('button').filter((button) => button.getAttribute('aria-current') === 'true'),
    ).toHaveLength(0);
  });
});
