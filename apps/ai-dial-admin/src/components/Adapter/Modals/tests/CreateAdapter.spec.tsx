import { ButtonsI18nKey, CreateI18nKey } from '@/src/constants/i18n';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import CreateAdapter from '../CreateAdapter';

describe('CreateAdapter', () => {
  test('renders popup and adapter properties', () => {
    render(
      <CreateAdapter
        modalState={PopUpState.Opened}
        onClose={vi.fn()}
        route={ApplicationRoute.Adapters}
        names={['adapter1']}
      />,
    );
    expect(screen.getByText(CreateI18nKey.Adapter)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Cancel)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Create)).toBeInTheDocument();
  });

  test('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <CreateAdapter modalState={PopUpState.Opened} onClose={onClose} route={ApplicationRoute.Adapters} names={[]} />,
    );
    fireEvent.click(screen.getByText(ButtonsI18nKey.Cancel));
    expect(onClose).toHaveBeenCalled();
  });
});
