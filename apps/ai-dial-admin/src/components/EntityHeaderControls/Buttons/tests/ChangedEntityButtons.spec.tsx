import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
import { ButtonsI18nKey } from '@/src/constants/i18n';

const getSave = () => screen.getByRole('button', { name: ButtonsI18nKey.Save });
const getDiscard = () => screen.getByRole('button', { name: ButtonsI18nKey.Discard });

describe('ChangedEntityButtons', () => {
  test('draws Discard as a solid neutral button and Save as a solid primary one', () => {
    render(<ChangedEntityButtons onDiscard={vi.fn()} onSave={vi.fn()} />);

    expect(getDiscard()).toHaveClass('dial-kit-neutral-solid-button');
    expect(getSave()).toHaveClass('dial-kit-primary-solid-button');
  });

  test('calls onSave when Save is clicked', () => {
    const onSave = vi.fn();
    render(<ChangedEntityButtons onDiscard={vi.fn()} onSave={onSave} />);

    fireEvent.click(getSave());

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  test('disables Save when disableSave is set', () => {
    render(<ChangedEntityButtons disableSave onDiscard={vi.fn()} onSave={vi.fn()} />);

    expect(getSave()).toBeDisabled();
  });

  test('uses saveLabel for the Save button', () => {
    render(<ChangedEntityButtons saveLabel="Publish" onDiscard={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled();
  });

  test('hides Save when saving is not allowed', () => {
    render(<ChangedEntityButtons isSaveAllowed={false} onDiscard={vi.fn()} onSave={vi.fn()} />);

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Save })).toBeNull();
    expect(getDiscard()).toBeInTheDocument();
  });

  test('does not discard until the confirmation is accepted', () => {
    const onDiscard = vi.fn();
    render(<ChangedEntityButtons onDiscard={onDiscard} onSave={vi.fn()} />);

    fireEvent.click(getDiscard());

    expect(onDiscard).not.toHaveBeenCalled();
  });
});
