import { render } from '@testing-library/react';
import InputModal from './InputModal';
import { PopUpState } from '@/src/types/pop-up';

const mockFunction = jest.fn();

describe('Common components - InputModal', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(
      <InputModal modalState={PopUpState.Opened} onOpenModal={mockFunction}>
        <div></div>
      </InputModal>,
    );
    expect(baseElement).toBeTruthy();
  });

  it('Should render with empty value successfully', () => {
    const { baseElement } = render(
      <InputModal modalState={PopUpState.Opened} onOpenModal={mockFunction} selectedValue={''}>
        <div></div>
      </InputModal>,
    );
    expect(baseElement).toBeTruthy();
  });
});
