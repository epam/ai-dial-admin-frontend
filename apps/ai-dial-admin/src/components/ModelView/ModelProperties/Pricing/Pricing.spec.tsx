import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import Pricing from './Pricing';

describe('Pricing', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(<Pricing model={{}} onChangeModel={jest.fn()} />);
    expect(baseElement).toBeTruthy();
  });
});
