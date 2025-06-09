import ReadonlyField from './ReadonlyField';
import { renderWithContext } from '@/src/utils/tests/renderWithContext';

describe('Common components - ReadonlyField', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(<ReadonlyField title="title" value="value" />);

    expect(baseElement).toBeTruthy();
  });
});
