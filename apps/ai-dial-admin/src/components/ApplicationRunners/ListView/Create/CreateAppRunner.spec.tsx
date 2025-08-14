import { PopUpState } from '@/src/types/pop-up';
import { render } from '@testing-library/react';
import CreateScheme from './CreateAppRunner';
import { describe, expect, test, vi } from 'vitest';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

describe('Components :: CreateScheme', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(
      <SaveValidationContextProvider>
        <CreateScheme onClose={vi.fn()} modalState={PopUpState.Opened} />
      </SaveValidationContextProvider>,
    );

    expect(baseElement).toBeTruthy();
  });
});
