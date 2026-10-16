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
const getSaveAsNewVersion = () => screen.getByRole('button', { name: ButtonsI18nKey.SaveAsNewVersion });

describe('AssetChangedEntityButtons', () => {
  test('enables Save and Save as new version when nothing blocks saving', () => {
    renderButtons();

    expect(getSave()).toBeEnabled();
    expect(getSaveAsNewVersion()).toBeEnabled();
  });

  test('disables Save and Save as new version while a save is pending', () => {
    renderButtons({ isSaving: true });

    expect(getSave()).toBeDisabled();
    expect(getSaveAsNewVersion()).toBeDisabled();
  });

  test('disables only Save when isSaveDisabled is set', () => {
    renderButtons({ isSaveDisabled: true });

    expect(getSave()).toBeDisabled();
    expect(getSaveAsNewVersion()).toBeEnabled();
  });
});
