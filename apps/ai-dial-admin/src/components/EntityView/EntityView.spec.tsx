import { render } from '@testing-library/react';
import AddEntitiesGrid from './AddEntitiesGrid';
import { PopUpState } from '../../types/pop-up';
import { describe, expect, test, vi } from 'vitest';

const mockFunction = vi.fn();

describe('EntityView - AddEntitiesGrid', () => {
  test('Should render successfully', () => {
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
