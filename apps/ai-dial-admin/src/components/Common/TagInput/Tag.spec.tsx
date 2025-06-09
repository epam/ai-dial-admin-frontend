import { render } from '@testing-library/react';
import Tag from './Tag';

describe('Components :: Tag', () => {
  it('Should render correctly', () => {
    const { getByTestId } = render(<Tag tag="tag" />);

    const filter = getByTestId('tag');
    expect(filter).toBeTruthy();
  });
});
