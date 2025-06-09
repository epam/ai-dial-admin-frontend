import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import { PopUpState } from '@/src/types/pop-up';
import AddVersionModal from './AddVersionModal';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Common components - AddVersionModal', () => {
  it('renders input and buttons', () => {
    renderWithContext(
      <AddVersionModal
        existingVersions={[]}
        modalState={PopUpState.Opened}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buttons.Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buttons.Create' })).toBeInTheDocument();
  });

  it('handles close and confirm actions', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onConfirm = jest.fn();

    renderWithContext(
      <AddVersionModal existingVersions={[]} modalState={PopUpState.Opened} onClose={onClose} onConfirm={onConfirm} />,
    );

    await user.click(screen.getByRole('button', { name: 'Buttons.Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    const input = screen.getByRole('textbox');
    await user.type(input, '3.0.0');

    await user.click(screen.getByRole('button', { name: 'Buttons.Create' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith('3.0.0');
  });

  it('renders provided versions and handles version change', async () => {
    const user = userEvent.setup();
    const existingVersions = ['1.0.0', '2.0.0'];
    renderWithContext(
      <AddVersionModal
        existingVersions={existingVersions}
        modalState={PopUpState.Opened}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');

    await user.clear(input);
    await user.paste('3.0.0');
    expect(input).toHaveValue('3.0.0');
  });
});
