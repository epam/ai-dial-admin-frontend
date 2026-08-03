import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { ModelAssetI18nKey } from '@/src/constants/i18n';
import { DialModelResource, DialModelResourceStatus } from '@/src/models/dial/resource';
import InvalidModelBanner from '../InvalidModelBanner';
import UpstreamSecretWarning from '../UpstreamSecretWarning';

const asset = (overrides: Partial<DialModelResource> = {}) =>
  ({ name: 'gpt-4', path: 'gpt-4', folderId: '', ...overrides }) as DialModelResource;

describe('Model asset :: invalid-model banner', () => {
  test('Should warn that an invalid model is not part of the served configuration', () => {
    render(<InvalidModelBanner asset={asset({ status: DialModelResourceStatus.Invalid })} />);

    expect(screen.getByText(ModelAssetI18nKey.InvalidTitle)).toBeInTheDocument();
  });

  test('Should name the offending field rather than discarding the warnings', () => {
    render(
      <InvalidModelBanner
        asset={asset({
          status: DialModelResourceStatus.Invalid,
          validationWarnings: [{ field: 'interceptors[0]', message: "Interceptor 'missing' not found in config" }],
        })}
      />,
    );

    expect(screen.getByText(/interceptors\[0\]: Interceptor 'missing' not found in config/)).toBeInTheDocument();
  });

  test('Should render nothing for a valid model', () => {
    const { container } = render(<InvalidModelBanner asset={asset({ status: DialModelResourceStatus.Valid })} />);

    expect(container).toBeEmptyDOMElement();
  });

  test('Should render nothing when Core reported no status at all', () => {
    const { container } = render(<InvalidModelBanner asset={asset()} />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe('Model asset :: upstream secret-loss warning', () => {
  test('Should warn while editing when a renamed endpoint would lose its stored key', () => {
    render(
      <UpstreamSecretWarning
        originalUpstreams={[{ endpoint: 'http://old' }]}
        editedUpstreams={[{ endpoint: 'http://new' }]}
      />,
    );

    expect(screen.getByText(ModelAssetI18nKey.SecretLossTitle)).toBeInTheDocument();
    expect(screen.getByText(/http:\/\/new/)).toBeInTheDocument();
  });

  // Both secrets, not just the key: Core returns neither on read, so there is no way to know which the
  // stored upstream had, and re-entering one leaves the other equally unrecoverable.
  test('Should stay silent once both secrets are re-entered', () => {
    const { container } = render(
      <UpstreamSecretWarning
        originalUpstreams={[{ endpoint: 'http://old' }]}
        editedUpstreams={[{ endpoint: 'http://new', key: 'fresh', secretExtraData: '{"a":1}' }]}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('Should still warn when only the key was re-entered', () => {
    render(
      <UpstreamSecretWarning
        originalUpstreams={[{ endpoint: 'http://old' }]}
        editedUpstreams={[{ endpoint: 'http://new', key: 'fresh' }]}
      />,
    );

    expect(screen.getByText(ModelAssetI18nKey.SecretLossTitle)).toBeInTheDocument();
  });

  test('Should stay silent for an added upstream, which never had a stored secret', () => {
    const { container } = render(
      <UpstreamSecretWarning
        originalUpstreams={[{ endpoint: 'http://a' }]}
        editedUpstreams={[{ endpoint: 'http://a' }, { endpoint: 'http://added' }]}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('Should stay silent when the endpoint is unchanged', () => {
    const { container } = render(
      <UpstreamSecretWarning
        originalUpstreams={[{ endpoint: 'http://same' }]}
        editedUpstreams={[{ endpoint: 'http://same' }]}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
