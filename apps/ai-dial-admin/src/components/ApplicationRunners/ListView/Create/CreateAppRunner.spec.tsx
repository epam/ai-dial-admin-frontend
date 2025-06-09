import { PopUpState } from '@/src/types/pop-up';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import CreateScheme from './CreateAppRunner';

describe('Components :: CreateScheme', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(<CreateScheme onClose={jest.fn()} modalState={PopUpState.Opened} />);

    expect(baseElement).toBeTruthy();
  });
});
