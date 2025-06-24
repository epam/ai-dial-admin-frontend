import { render } from '@testing-library/react';
import RadioGroupModal from './RadioGroupModal';
import { PopUpState } from '@/src/types/pop-up';
import RadioGroupModalField from './RadioGroupModalField';
import { describe, expect, test, vi } from 'vitest';

const mockFunction = vi.fn();

const radioButtons = [
  { id: 'id1', name: 'ID 1', content: 'content1' },
  { id: 'id2', name: 'ID 2', content: 'content2' },
];

describe('RadioGroupModalField :: RadioGroupModal', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <RadioGroupModal
        modalState={PopUpState.Opened}
        elementId="elementId"
        portalId="portalId"
        title="title"
        onClose={mockFunction}
        radioButtons={radioButtons}
        selectedValue="id1"
        isValid={true}
        onChangeRadioField={mockFunction}
        onApply={mockFunction}
      />,
    );
    expect(baseElement).toBeTruthy();
  });
});

describe('RadioGroupModalField :: RadioGroupModalField', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <RadioGroupModalField
        title="title"
        elementId="elementId"
        portalId="portalId"
        radioButtons={radioButtons}
        selectedRadioValue="id1"
        selectedInputValue="id1"
        isValid={true}
        onChangeRadioField={mockFunction}
        onApply={mockFunction}
      />,
    );
    expect(baseElement).toBeTruthy();
  });
});
