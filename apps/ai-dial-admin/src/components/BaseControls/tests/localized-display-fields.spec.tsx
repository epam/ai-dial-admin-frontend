import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import DescriptionControl from '../Description';
import DisplayNameControl from '../DisplayName';
import IntroControl from '../Intro';

const MAP = { en: 'Hello', fr: 'Bonjour' };

describe('DisplayNameControl — a locale map', () => {
  const field = () => screen.getByRole('textbox', { name: `${EntityFieldsI18nKey.displayName}*` });

  test('shows the fallback-locale value rather than a serialized object', () => {
    render(<DisplayNameControl displayName={MAP} required onChange={vi.fn()} />);

    expect(field().getAttribute('value')).toEqual('Hello');
  });

  test('shows the first available value when the fallback locale is absent', () => {
    render(<DisplayNameControl displayName={{ fr: 'Bonjour' }} required onChange={vi.fn()} />);

    expect(field().getAttribute('value')).toEqual('Bonjour');
  });

  test('is not editable as text', () => {
    render(<DisplayNameControl displayName={MAP} required onChange={vi.fn()} />);

    expect(field()).toBeDisabled();
  });

  test('is never overwritten by the rendering', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DisplayNameControl displayName={MAP} required onChange={onChange} />);

    await user.type(field(), 'x');

    expect(onChange).not.toHaveBeenCalled();
  });

  test('leaves a plain string editable, exactly as before', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DisplayNameControl displayName="Hello" required onChange={onChange} />);

    expect(field()).not.toBeDisabled();
    await user.type(field(), '!');

    expect(onChange).toHaveBeenCalledWith('Hello!');
  });
});

describe('DescriptionControl — a locale map', () => {
  const field = () => screen.getByRole('textbox', { name: EntityFieldsI18nKey.description });

  test('shows the fallback-locale value rather than a serialized object', () => {
    render(<DescriptionControl entity={{ description: MAP }} onChangeEntity={vi.fn()} />);

    expect(field()).toHaveValue('Hello');
  });

  test('is not editable as text', () => {
    render(<DescriptionControl entity={{ description: MAP }} onChangeEntity={vi.fn()} />);

    expect(field()).toBeDisabled();
  });

  test('leaves a plain string editable, exactly as before', async () => {
    const user = userEvent.setup();
    const onChangeEntity = vi.fn();
    render(<DescriptionControl entity={{ description: 'Hello' }} onChangeEntity={onChangeEntity} />);

    await user.type(field(), '!');

    expect(onChangeEntity).toHaveBeenCalledWith({ description: 'Hello!' });
  });
});

describe('IntroControl — a locale map', () => {
  const field = () => screen.getByRole('textbox', { name: EntityFieldsI18nKey.intro });

  test("carries another field's locale map through an unrelated edit", async () => {
    const user = userEvent.setup();
    const onChangeEntity = vi.fn();
    render(<IntroControl entity={{ description: MAP, intro: 'Welcome' }} onChangeEntity={onChangeEntity} />);

    await user.type(field(), '!');

    expect(onChangeEntity.mock.calls[0][0].description).toEqual(MAP);
  });

  test('shows the fallback-locale value rather than a serialized object', () => {
    render(<IntroControl entity={{ intro: MAP }} onChangeEntity={vi.fn()} />);

    expect(field()).toHaveValue('Hello');
  });

  test('is not editable as text', () => {
    render(<IntroControl entity={{ intro: MAP }} onChangeEntity={vi.fn()} />);

    expect(field()).toBeDisabled();
  });

  test('leaves a plain string editable, exactly as before', async () => {
    const user = userEvent.setup();
    const onChangeEntity = vi.fn();
    render(<IntroControl entity={{ intro: 'Welcome' }} onChangeEntity={onChangeEntity} />);

    await user.type(field(), '!');

    expect(onChangeEntity).toHaveBeenCalledWith({ intro: 'Welcome!' });
  });
});
