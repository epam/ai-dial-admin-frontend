import { PopUpState } from '@/src/types/pop-up';
import { render } from '@testing-library/react';
import CreateAppRunner from '../CreateAppRunner';
import { describe, expect, test, vi } from 'vitest';

describe('Components :: CreateScheme', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<CreateAppRunner onClose={vi.fn()} modalState={PopUpState.Opened} />);

    expect(baseElement).toBeTruthy();
  });
});
