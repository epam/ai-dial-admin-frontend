import CopyButton from './CopyButton';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(),
  },
});
describe('Common components :: CopyButton', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(<CopyButton field="value" />);

    expect(baseElement).toBeTruthy();
    const button = baseElement.getElementsByTagName('button')[0];
    button.click();
  });
});
