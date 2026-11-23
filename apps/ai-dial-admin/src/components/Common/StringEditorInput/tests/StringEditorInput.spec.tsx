import { ComponentProps, useState } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import StringEditorInput from '@/src/components/Common/StringEditorInput/StringEditorInput';
import { ButtonsI18nKey } from '@/src/constants/i18n';

const LABEL = 'Parameter value';
const OPEN = `${ButtonsI18nKey.Open} ${LABEL}`;

describe('StringEditorInput', () => {
  const onChangeValue = vi.fn();

  const renderInput = (props: Partial<ComponentProps<typeof StringEditorInput>> = {}) => {
    const user = userEvent.setup();
    render(<StringEditorInput value="initial" label={LABEL} onChangeValue={onChangeValue} {...props} />);
    return user;
  };

  const openEditor = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: OPEN }));
    return screen.getByRole('textbox', { name: LABEL, hidden: false }) as HTMLTextAreaElement;
  };

  beforeEach(() => vi.clearAllMocks());

  test('updates single-line values inline', async () => {
    const user = renderInput();
    await user.type(screen.getByRole('textbox', { name: LABEL }), '!');
    expect(onChangeValue).toHaveBeenCalledWith('initial!');
  });

  test('shows a read-only preview and opens the complete multiline value', async () => {
    const user = renderInput({ value: '  first\n\nsecond  \n' });
    const preview = screen.getByRole('textbox', { name: LABEL });
    expect(preview).toHaveAttribute('readonly');
    expect(preview).toHaveValue('  first  second   ');
    const editor = await openEditor(user);
    expect(editor).toHaveValue('  first\n\nsecond  \n');
    expect(editor).toHaveFocus();
  });

  test('applies arbitrary text with whitespace and trailing newlines unchanged', async () => {
    const user = renderInput();
    const editor = await openEditor(user);
    const text = '  not: [yaml\n\n    raw  \n';
    fireEvent.change(editor, { target: { value: text } });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Apply }));
    expect(onChangeValue).toHaveBeenCalledWith(text);
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Apply })).toBeNull();
    expect(screen.getByRole('button', { name: OPEN })).toHaveFocus();
  });

  test('preserves CRLF on an untouched Apply', async () => {
    const user = renderInput({ value: 'first\r\nsecond\r\n' });
    const editor = await openEditor(user);
    expect(editor).toHaveValue('first\nsecond\n');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Apply }));
    expect(onChangeValue).toHaveBeenCalledWith('first\r\nsecond\r\n');
  });

  test('accepts an empty draft and indicates required empty values', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <StringEditorInput value="text" label={LABEL} required onChangeValue={onChangeValue} />,
    );
    const editor = await openEditor(user);
    await user.clear(editor);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Apply }));
    expect(onChangeValue).toHaveBeenCalledWith('');
    rerender(<StringEditorInput value="" label={LABEL} required onChangeValue={onChangeValue} />);
    const input = screen.getByRole('textbox', { name: LABEL });
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  test.each(['cancel', 'close', 'escape'])(
    'discards drafts on %s and reopens with the committed value',
    async (action) => {
      const user = renderInput({ value: 'first\nsecond' });
      const editor = await openEditor(user);
      fireEvent.change(editor, { target: { value: 'changed' } });
      if (action === 'cancel') await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));
      if (action === 'close') await user.click(screen.getByRole('button', { name: /close/i }));
      if (action === 'escape') await user.keyboard('{Escape}');
      expect(onChangeValue).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: ButtonsI18nKey.Apply })).toBeNull();
      expect(screen.getByRole('button', { name: OPEN })).toHaveFocus();
      expect(await openEditor(user)).toHaveValue('first\nsecond');
    },
  );

  test('switches back to inline editing when a single-line value is applied', async () => {
    const user = userEvent.setup();
    const Controlled = () => {
      const [value, setValue] = useState('first\nsecond');
      return <StringEditorInput value={value} label={LABEL} onChangeValue={setValue} />;
    };
    render(<Controlled />);
    fireEvent.change(await openEditor(user), { target: { value: 'single' } });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Apply }));
    const input = screen.getByRole('textbox', { name: LABEL });
    expect(input).not.toHaveAttribute('readonly');
    await user.type(input, '!');
    expect(input).toHaveValue('single!');
  });

  test('prevents editing and opening when disabled', () => {
    renderInput({ value: 'first\nsecond', disabled: true });
    expect(screen.getByText('first second')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: LABEL })).toBeNull();
    expect(screen.queryByRole('button', { name: OPEN })).toBeNull();
  });

  test('opens from the keyboard and keeps editors isolated', async () => {
    const user = userEvent.setup();
    render(
      <>
        <StringEditorInput value="first" label={LABEL} onChangeValue={onChangeValue} />
        <StringEditorInput value="second" label="Other value" onChangeValue={onChangeValue} />
      </>,
    );
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: OPEN })).toHaveFocus();
    await user.keyboard('{Enter}');
    const editor = screen.getByRole('textbox', { name: LABEL, hidden: false });
    expect(editor).toHaveValue('first');
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));
    await user.click(screen.getByRole('button', { name: `${ButtonsI18nKey.Open} Other value` }));
    expect(screen.getByRole('textbox', { name: 'Other value', hidden: false })).toHaveValue('second');
  });
});
