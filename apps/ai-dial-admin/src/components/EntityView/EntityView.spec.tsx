import { render } from '@testing-library/react';
import AddEntitiesGrid from './AddEntitiesGrid';
import { PopUpState } from '../../types/pop-up';

const mockFunction = jest.fn();

describe('EntityView - AddEntitiesGrid', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(
      <AddEntitiesGrid
        entities={[]}
        emptyTitle={''}
        modalState={PopUpState.Opened}
        modalTitle="test-title"
        onApply={mockFunction}
        onClose={mockFunction}
      />,
    );
    expect(baseElement).toBeTruthy();
  });
});
