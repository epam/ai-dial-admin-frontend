import { fireEvent, render } from '@testing-library/react';
import { PopUpState } from '@/src/types/pop-up';
import ConfirmationModal from './ConfirmationModal';

const mockFunction = jest.fn();

describe('Common :: ConfirmationModal', () => {
  it('Should render successfully', () => {
    let isClose = false;
    const onClose = () => {
      isClose = true;
    };

    let isConfirm = false;
    const onConfirm = () => {
      isConfirm = true;
    };

    const { baseElement, getByTestId } = render(
      <ConfirmationModal
        modalState={PopUpState.Opened}
        onConfirm={onConfirm}
        onClose={onClose}
        description="description"
        heading="heading"
        confirmLabel="Confirm"
      />,
    );
    expect(baseElement).toBeTruthy();

    expect(isClose).toBeFalsy();
    const closeBtn = getByTestId('modalCancel');
    fireEvent.click(closeBtn);
    expect(isClose).toBeTruthy();

    expect(isConfirm).toBeFalsy();
    const confirmBtn = getByTestId('modalConfirm');
    fireEvent.click(confirmBtn);
    expect(isConfirm).toBeTruthy();
  });

  it('Should render successfully with loading', () => {
    const { baseElement } = render(
      <ConfirmationModal
        modalState={PopUpState.Opened}
        onConfirm={mockFunction}
        onCancel={mockFunction}
        onClose={mockFunction}
        isLoading={true}
        description="description"
        heading="heading"
        confirmLabel="Confirm"
      />,
    );
    expect(baseElement).toBeTruthy();
  });

  it('Should render successfully with cancel', () => {
    let isClose = false;
    const onClose = () => {
      isClose = true;
    };

    const { baseElement, getByTestId } = render(
      <ConfirmationModal
        modalState={PopUpState.Opened}
        onConfirm={mockFunction}
        onCancel={onClose}
        onClose={mockFunction}
        description="description"
        heading="heading"
        confirmLabel="Confirm"
      />,
    );
    expect(baseElement).toBeTruthy();
    expect(isClose).toBeFalsy();
    const closeBtn = getByTestId('modalCancel');
    fireEvent.click(closeBtn);
    expect(isClose).toBeTruthy();
  });
});
