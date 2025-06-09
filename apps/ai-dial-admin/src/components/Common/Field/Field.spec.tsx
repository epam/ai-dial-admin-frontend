import { render } from '@testing-library/react';
import Field from './Field';

describe('Common components - Field', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(<Field fieldTitle="Title" htmlFor="test id" />);

    expect(baseElement).toBeTruthy();
    const label = baseElement.getElementsByTagName('label')[0];
    expect(label.htmlFor).toBe('test id');
  });

  it('Should set fieldTitle', () => {
    const { baseElement } = render(<Field htmlFor="test id" fieldTitle="Title" />);

    expect(baseElement).toBeTruthy();
    const label = baseElement.getElementsByTagName('label')[0];
    expect(label.innerHTML).toBe('Title');
  });

  it('Should set optional', () => {
    const { baseElement } = render(<Field htmlFor="test id" fieldTitle="Title" optional={true} />);

    expect(baseElement).toBeTruthy();
    const label = baseElement.getElementsByTagName('label')[0];
    const span = label.getElementsByTagName('span')[0];
    expect(span.innerHTML).toBe('(Optional)');
  });
});
