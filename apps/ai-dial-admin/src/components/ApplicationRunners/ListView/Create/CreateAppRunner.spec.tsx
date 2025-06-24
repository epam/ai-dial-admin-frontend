import { PopUpState } from '@/src/types/pop-up';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import CreateScheme from './CreateAppRunner';
import { describe, expect, test, vi } from 'vitest';

describe('Components :: CreateScheme', () => {
  test('Should render successfully', () => {
    const { baseElement } = renderWithContext(<CreateScheme onClose={vi.fn()} modalState={PopUpState.Opened} />);

    expect(baseElement).toBeTruthy();
  });
});
