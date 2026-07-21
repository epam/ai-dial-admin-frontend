import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import IntroControl from '@/src/components/BaseControls/Intro';

describe('IntroControl', () => {
  test('renders the intro field with its current value', () => {
    render(<IntroControl entity={{ intro: 'Welcome to this entity' }} />);

    expect(screen.getByText(EntityFieldsI18nKey.intro)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('Welcome to this entity');
  });

  test('calls onChangeEntity with the updated intro value, preserving other entity fields', async () => {
    const user = userEvent.setup();
    const onChangeEntity = vi.fn();

    render(<IntroControl entity={{ intro: '', name: 'entity-1' }} onChangeEntity={onChangeEntity} />);

    await user.type(screen.getByRole('textbox'), 'X');

    expect(onChangeEntity).toHaveBeenCalledWith({ intro: 'X', name: 'entity-1' });
  });

  test('shows a validation error when intro exceeds the max length', () => {
    const onChangeEntity = vi.fn();

    render(<IntroControl entity={{ intro: '' }} onChangeEntity={onChangeEntity} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: new Array(2049).fill('a').join('') } });

    expect(screen.getByText(ErrorI18nKey.IntroLength)).toBeInTheDocument();
  });
});
