import { render } from '@testing-library/react';
import InputWithIcon from './InputWithIcon';

describe('Common components - InputWithIcon', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(
      <InputWithIcon inputId="testInput" iconBeforeInput={<div>Before</div>} iconAfterInput={<div>After</div>} />,
    );
    expect(baseElement).toBeTruthy();
  });
});
