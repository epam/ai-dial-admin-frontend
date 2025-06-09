import { render } from '@testing-library/react';
import Footer from './Footer';

describe('Footer', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(<Footer version={'version'} />);
    expect(baseElement).toBeTruthy();
  });
});
