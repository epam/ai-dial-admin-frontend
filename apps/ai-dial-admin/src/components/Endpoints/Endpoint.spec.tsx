import { renderWithContext } from '@/src/utils/tests/renderWithContext';
import Endpoint from './Endpoint';
import UpstreamEndpoints from './UpstreamEndpoints';

describe('Endpoint', () => {
  it('Should render first endpoint successfully', () => {
    const { baseElement } = renderWithContext(
      <Endpoint endpoint={{}} numEndpoints={4} removeEndpoint={jest.fn()} updateEndpoint={jest.fn()} index={0} />,
    );
    expect(baseElement).toBeTruthy();
  });

  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <Endpoint endpoint={{}} numEndpoints={4} removeEndpoint={jest.fn()} updateEndpoint={jest.fn()} index={1} />,
    );
    expect(baseElement).toBeTruthy();
  });
});

describe('UpstreamEndpoints', () => {
  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <UpstreamEndpoints entity={{ endpoint: '' }} onChangeEntity={jest.fn()} />,
    );
    expect(baseElement).toBeTruthy();
  });

  it('Should render successfully', () => {
    const { baseElement } = renderWithContext(
      <UpstreamEndpoints entity={{ endpoint: '' }} onChangeEntity={jest.fn()} />,
    );
    expect(baseElement).toBeTruthy();
  });
});
