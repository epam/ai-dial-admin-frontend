import { render } from '@testing-library/react';
import TagInput from './TagInput';

describe('Components :: TagInput', () => {
  it('Should render correctly', () => {
    const { getByTestId } = render(<TagInput />);

    const filter = getByTestId('tag-input');
    expect(filter).toBeTruthy();
  });
});
