import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import AssetChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/AssetChangedEntityButtons';
import { ButtonsI18nKey } from '@/src/constants/i18n';

interface RenderProps {
  isSaving?: boolean;
  isSaveDisabled?: boolean;
}

const renderButtons = (props?: RenderProps) =>
  render(<AssetChangedEntityButtons {...props} onDiscard={vi.fn()} onSave={vi.fn()} />);

const getSave = () => screen.getByRole('button', { name: ButtonsI18nKey.Save });

describe('AssetChangedEntityButtons', () => {
  test('enables Save without offering a new-version action', () => {
    renderButtons();

    expect(getSave()).toBeEnabled();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.SaveAsNewVersion })).toBeNull();
  });

  test('disables Save while a save is pending', () => {
    renderButtons({ isSaving: true });

    expect(getSave()).toBeDisabled();
  });

  test('disables Save but leaves Discard enabled when the iframe is invalid', () => {
    renderButtons({ isSaveDisabled: true });

    expect(getSave()).toBeDisabled();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Discard })).toBeEnabled();
  });
});
