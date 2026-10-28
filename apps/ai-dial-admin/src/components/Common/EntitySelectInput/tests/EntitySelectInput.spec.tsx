import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import EntitySelectInput from '../EntitySelectInput';
import { EntitySelectType } from '../models';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({ useIsReadOnlyAdmin: () => false }));

vi.mock('@/src/components/Common/InputPopup/InputPopup', () => ({
  default: ({ selectedValue, onOpen, disabled, children }: any) => (
    <div>
      <input aria-label="skill-value" readOnly value={selectedValue} />
      <button disabled={disabled} onClick={onOpen}>
        open
      </button>
      {children}
    </div>
  ),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@epam/ai-dial-ui-kit')>()),
  Popup: ({ open, header, mainButtons, children }: any) =>
    open ? (
      <section aria-label={header}>
        {children}
        {mainButtons.map((button: any) => (
          <button key={button.label} disabled={button.disabled} onClick={button.onClick}>
            {button.label}
          </button>
        ))}
      </section>
    ) : null,
}));

vi.mock('../EntitySelectManager', () => ({
  default: ({ value, onChangeSelectedPath }: any) => (
    <div>
      <span>{`manager:${value}`}</span>
      <button onClick={() => onChangeSelectedPath('public/folder/my-skill')}>pick-skill</button>
      <button onClick={() => onChangeSelectedPath(null)}>pick-folder</button>
    </div>
  ),
}));

describe('EntitySelectInput', () => {
  const onChangeValue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderInput = (props?: Partial<Parameters<typeof EntitySelectInput>[0]>) =>
    render(<EntitySelectInput entityType={EntitySelectType.Skill} value="" onChangeValue={onChangeValue} {...props} />);

  test('emits the skill reference with the skills prefix when a skill is confirmed', async () => {
    const user = userEvent.setup();
    renderInput();

    await user.click(screen.getByRole('button', { name: 'open' }));
    await user.click(screen.getByRole('button', { name: 'pick-skill' }));
    await user.click(screen.getByRole('button', { name: 'Buttons.Confirm' }));

    expect(onChangeValue).toHaveBeenCalledWith('skills/public/folder/my-skill');
  });

  test('keeps confirm disabled until a skill is selected, and when a folder is clicked', async () => {
    const user = userEvent.setup();
    renderInput();

    await user.click(screen.getByRole('button', { name: 'open' }));
    const confirm = screen.getByRole('button', { name: 'Buttons.Confirm' });
    expect(confirm).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'pick-skill' }));
    expect(confirm).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'pick-folder' }));
    expect(confirm).toBeDisabled();
  });

  test('forgets a cancelled pick, so reopening does not allow confirming a skill the dialog does not show', async () => {
    const user = userEvent.setup();
    renderInput();

    await user.click(screen.getByRole('button', { name: 'open' }));
    await user.click(screen.getByRole('button', { name: 'pick-skill' }));
    await user.click(screen.getByRole('button', { name: 'Buttons.Cancel' }));
    await user.click(screen.getByRole('button', { name: 'open' }));

    expect(screen.getByRole('button', { name: 'Buttons.Confirm' })).toBeDisabled();
    expect(onChangeValue).not.toHaveBeenCalled();
  });

  test('shows the stored reference and hands the browser the path without the prefix', async () => {
    const user = userEvent.setup();
    renderInput({ value: 'skills/public/my-skill' });

    expect(screen.getByLabelText('skill-value')).toHaveValue('skills/public/my-skill');

    await user.click(screen.getByRole('button', { name: 'open' }));
    expect(screen.getByText('manager:public/my-skill')).toBeTruthy();
  });

  test('displays a stale file value as empty', () => {
    renderInput({ value: 'files/public/report.pdf' });

    expect(screen.getByLabelText('skill-value')).toHaveValue('');
  });

  test('cannot be opened when disabled', () => {
    renderInput({ disabled: true });

    expect(screen.getByRole('button', { name: 'open' })).toBeDisabled();
  });
});
