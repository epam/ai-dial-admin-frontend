import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { resourceFeatureLabelMap } from '@/src/components/Assets/Resources/constants';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import InterfaceFeaturesButton from '../InterfaceFeaturesButton';

// DialSwitch's real markup doesn't associate its label with the checkbox accessibly in jsdom — same
// mock shape as Assets/Platform/Models/tests/Features.spec.tsx.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  DialSwitch: ({ label, isOn, onChange, disabled, switchId }: any) => (
    <label>
      <span>{label}</span>
      <input
        type="checkbox"
        role="switch"
        aria-label={label}
        id={switchId}
        checked={!!isOn}
        disabled={disabled}
        onChange={() => onChange(!isOn)}
      />
    </label>
  ),
}));

describe('InterfaceFeaturesButton', () => {
  test('does not show the popup until the Features button is clicked', () => {
    render(<InterfaceFeaturesButton fieldId="row-1" features={{}} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Features })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('opening the popup shows the typed switch controls', async () => {
    const user = userEvent.setup();
    render(<InterfaceFeaturesButton fieldId="row-1" features={{}} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Features }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(resourceFeatureLabelMap.tools_supported)).toBeInTheDocument();
  });

  test('reflects the current feature values as switch state', async () => {
    const user = userEvent.setup();
    render(<InterfaceFeaturesButton fieldId="row-1" features={{ tools_supported: true }} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Features }));

    expect(screen.getByRole('switch', { name: resourceFeatureLabelMap.tools_supported })).toBeChecked();
  });

  test('toggling a switch and applying calls onChange with the updated features', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<InterfaceFeaturesButton fieldId="row-1" features={{}} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Features }));
    await user.click(screen.getByRole('switch', { name: resourceFeatureLabelMap.tools_supported }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Apply }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ tools_supported: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('cancelling closes the popup without calling onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<InterfaceFeaturesButton fieldId="row-1" features={{}} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Features }));
    await user.click(screen.getByRole('switch', { name: resourceFeatureLabelMap.tools_supported }));
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
