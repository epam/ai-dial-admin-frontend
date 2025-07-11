import { render } from '@testing-library/react';
import Endpoint from './Endpoint';
import UpstreamEndpoints from './UpstreamEndpoints';
import { describe, expect, test, vi } from 'vitest';

describe('Endpoint', () => {
  test('Should render first endpoint successfully', () => {
    const { baseElement } = render(
      <Endpoint endpoint={{}} numEndpoints={4} removeEndpoint={vi.fn()} updateEndpoint={vi.fn()} index={0} />,
    );
    expect(baseElement).toBeTruthy();
  });

  test('Should render successfully', () => {
    const { baseElement } = render(
      <Endpoint endpoint={{}} numEndpoints={4} removeEndpoint={vi.fn()} updateEndpoint={vi.fn()} index={1} />,
    );
    expect(baseElement).toBeTruthy();
  });
});

describe('UpstreamEndpoints', () => {
  test('Should render successfully', () => {
    const { baseElement } = render(<UpstreamEndpoints entity={{ endpoint: '' }} onChangeEntity={vi.fn()} />);
    expect(baseElement).toBeTruthy();
  });

  test('Should render successfully', () => {
    const { baseElement } = render(<UpstreamEndpoints entity={{ endpoint: '' }} onChangeEntity={vi.fn()} />);
    expect(baseElement).toBeTruthy();
  });
});
