import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { DialAdapter } from '@/src/models/dial/adapter';
import { PopUpState } from '@/src/types/pop-up';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import DuplicateAdapter from '../DuplicateAdapter';

describe('DuplicateAdapter', () => {
  const baseAdapter: DialAdapter = {
    name: 'adapter1',
    displayName: 'Adapter One',
    baseEndpoint: 'http://endpoint',
  };

  test('renders all fields and buttons', () => {
    render(
      <DuplicateAdapter modalState={PopUpState.Opened} onClose={vi.fn()} adapter={baseAdapter} onDuplicate={vi.fn()} />,
    );

    expect(screen.getByText(EntityFieldsI18nKey.id)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.displayName)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.baseEndpoint)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Cancel)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Duplicate)).toBeInTheDocument();
  });

  test('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <DuplicateAdapter modalState={PopUpState.Opened} onClose={onClose} adapter={baseAdapter} onDuplicate={vi.fn()} />,
    );
    fireEvent.click(screen.getByText(ButtonsI18nKey.Cancel));
    expect(onClose).toHaveBeenCalled();
  });

  test('calls onDuplicate with correct entity when Duplicate is clicked', () => {
    const onDuplicate = vi.fn();
    render(
      <DuplicateAdapter
        modalState={PopUpState.Opened}
        onClose={vi.fn()}
        adapter={baseAdapter}
        onDuplicate={onDuplicate}
      />,
    );
    // Fill in the name to enable the button
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Id), { target: { value: 'adapter2' } });
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName), {
      target: { value: 'Adapter Two' },
    });
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Endpoint), {
      target: { value: 'http://new' },
    });
    expect(screen.getByText(ButtonsI18nKey.Duplicate)).not.toBeDisabled();
    fireEvent.click(screen.getByText(ButtonsI18nKey.Duplicate));
    expect(onDuplicate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'adapter2',
        displayName: 'Adapter Two',
        baseEndpoint: 'http://new',
      }),
    );
  });
});
