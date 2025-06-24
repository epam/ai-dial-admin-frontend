import { render } from '@testing-library/react';
import InputModal from './InputModal';
import { PopUpState } from '@/src/types/pop-up';
import { describe, expect, test, vi } from 'vitest';

const mockFunction = vi.fn();

describe('Common components - InputModal', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <InputModal modalState={PopUpState.Opened} onOpenModal={mockFunction}>
        <div></div>
      </InputModal>,
    );
    expect(baseElement).toBeTruthy();
  });

  test('Should render with empty value successfully', () => {
    const { baseElement } = render(
      <InputModal modalState={PopUpState.Opened} onOpenModal={mockFunction} selectedValue={''}>
        <div></div>
      </InputModal>,
    );
    expect(baseElement).toBeTruthy();
  });
});
