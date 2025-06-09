import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import ImportConfig from './ImportConfig';

describe('ImportConfig', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(<ImportConfig />);
    expect(baseElement).toBeTruthy();
  });
});
