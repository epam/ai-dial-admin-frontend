import { DialModelEndpoint, UpstreamAuthType } from '@/src/models/dial/model';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import UpstreamEndpoints from '../UpstreamEndpoints';

const endpointProps = vi.fn();

vi.mock('../Endpoint/Endpoint', () => ({
  default: (props: { isAuthKeyRequired?: boolean }) => {
    endpointProps(props);
    return null;
  },
}));

describe('UpstreamEndpoints — bearer key requirement', () => {
  beforeEach(() => {
    endpointProps.mockClear();
  });

  const renderWith = (original: DialModelEndpoint, edited: DialModelEndpoint) =>
    render(
      <UpstreamEndpoints
        entity={{ upstreams: [edited] }}
        onChangeEntity={vi.fn()}
        isAuthTypeSupported
        originalUpstreams={[original]}
      />,
    );

  const lastIsBearerKeyRequired = () => endpointProps.mock.lastCall?.[0].isAuthKeyRequired;

  test('does not require a key when switching from bearer to api key', () => {
    renderWith({ authType: { type: UpstreamAuthType.BEARER } }, { authType: { type: UpstreamAuthType.API_KEY } });
    expect(lastIsBearerKeyRequired()).toBe(false);
  });

  test('requires a key when switching from api key to bearer', () => {
    renderWith({ authType: { type: UpstreamAuthType.API_KEY } }, { authType: { type: UpstreamAuthType.BEARER } });
    expect(lastIsBearerKeyRequired()).toBe(true);
  });

  test('requires a key for a new bearer upstream', () => {
    renderWith({}, { authType: { type: UpstreamAuthType.BEARER } });
    expect(lastIsBearerKeyRequired()).toBe(true);
  });

  test('does not require a key when a saved bearer upstream is unchanged', () => {
    renderWith({ authType: { type: UpstreamAuthType.BEARER } }, { authType: { type: UpstreamAuthType.BEARER } });
    expect(lastIsBearerKeyRequired()).toBe(false);
  });
});
