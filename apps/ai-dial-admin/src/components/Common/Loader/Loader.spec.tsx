import { render } from '@testing-library/react';
import Loader from './Loader';

describe('Common components - Loader', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(<Loader />);
    expect(baseElement).toBeTruthy();
  });
});
