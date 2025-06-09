import { render } from '@testing-library/react';
import AdapterSelector from './AdapterSelector';
import { adaptersMock } from '@/src/utils/tests/mock/models.mock';

const mockFunction = jest.fn();

describe('Properties - AdapterSelector', () => {
  it('Should render successfully', () => {
    const { baseElement } = render(
      <AdapterSelector onChangeAdapter={mockFunction} adapters={adaptersMock} model={{}} />,
    );
    expect(baseElement).toBeTruthy();
  });
});
