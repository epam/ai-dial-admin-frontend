import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { EntityFieldsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';
import { DialModelResource, DialModelResourceType } from '@/src/models/dial/resource';
import ModelAssetProperties from '../Properties';

vi.mock('@/src/hooks/use-is-read-only-admin', () => ({
  useIsReadOnlyAdmin: vi.fn(() => false),
}));

const baseAsset = {
  name: 'gpt-4',
  path: 'gpt-4',
  folderId: '',
} as DialModelResource;

const renderProperties = (asset: Partial<DialModelResource> = {}) =>
  render(<ModelAssetProperties asset={{ ...baseAsset, ...asset } as DialModelResource} onChange={vi.fn()} />);

/**
 * `Defaults` renders its title as `"<title>: <count>"` inside a heading, so the accessible name is
 * matched by prefix rather than equality.
 */
const defaultsHeading = (title: string) => screen.queryByRole('heading', { name: (name) => name.startsWith(title) });

describe('Model asset Properties :: routing-critical fields', () => {
  test('Should render an endpoint field, so a model is routable without the JSON editor', () => {
    renderProperties();

    expect(screen.getByText(EntityFieldsI18nKey.endpoint)).toBeInTheDocument();
  });

  test('Should mark the endpoint as the fallback used only without an interface base URL', () => {
    renderProperties();

    expect(screen.getByText(EntityFieldsI18nKey.endpointLegacyCaption)).toBeInTheDocument();
  });

  test('Should render the upstream endpoints editor', () => {
    renderProperties({ upstreams: [{ endpoint: 'http://upstream-one' }] });

    expect(screen.getByDisplayValue('http://upstream-one')).toBeInTheDocument();
  });

  test('Should render the override name control', () => {
    renderProperties({ overrideName: 'upstream-facing-name' });

    expect(screen.getByDisplayValue('upstream-facing-name')).toBeInTheDocument();
  });

  test('Should offer no source selector, since a Core model resource carries no source', () => {
    renderProperties();

    expect(screen.queryByText(EntityFieldsI18nKey.$type)).not.toBeInTheDocument();
  });
});

describe('Model asset Properties :: identity fields', () => {
  test('Should show the bare deployment id callers invoke, since Core keys models by short name', () => {
    renderProperties({ name: 'gpt-4' });

    expect(screen.getByText('gpt-4')).toBeInTheDocument();
  });

  test('Should render an optional display version field', () => {
    renderProperties({ displayVersion: '1.2.3' });

    expect(screen.getByDisplayValue('1.2.3')).toBeInTheDocument();
  });

  // Asserted on the control's own optionality rather than on the absence of the entity-surface error
  // strings: those come from `EntityMainProperties/Properties/utils.ts`, which this tree never renders,
  // so no reachable prop combination could have produced them.
  test('Should not require a display version, since Core enforces no display identity', () => {
    renderProperties({ displayName: 'Shared Display Name' });

    // The control marks a required field by appending `*` to its label, so the bare label is the
    // assertion — flip `optional` off and the starred variant renders instead.
    expect(screen.getByText(EntityFieldsI18nKey.displayVersion)).toBeInTheDocument();
    expect(screen.queryByText(`${EntityFieldsI18nKey.displayVersion}*`)).not.toBeInTheDocument();
  });
});

describe('Model asset Properties :: embedding dimensions gating', () => {
  test('Should show embedding dimensions for an embedding model', () => {
    renderProperties({ type: DialModelResourceType.Embedding });

    expect(screen.getByText(EntityFieldsI18nKey.embeddingDimensions)).toBeInTheDocument();
  });

  test.each([DialModelResourceType.Chat, DialModelResourceType.Completion])(
    'Should hide embedding dimensions for a %s model',
    (type) => {
      renderProperties({ type });

      expect(screen.queryByText(EntityFieldsI18nKey.embeddingDimensions)).not.toBeInTheDocument();
    },
  );
});

describe('Model asset Properties :: responses defaults gating', () => {
  test('Should show responses defaults when an openaiResponses base URL is declared', () => {
    renderProperties({
      interfaces: { [DeploymentInterfaceType.OpenAIResponses]: { base_url: 'http://core/responses' } },
    });

    expect(defaultsHeading(EntityFieldsI18nKey.responsesDefaults)).toBeInTheDocument();
  });

  test('Should show responses defaults on the legacy responses endpoint alone', () => {
    renderProperties({ responsesEndpoint: 'http://core/v1/responses' });

    expect(defaultsHeading(EntityFieldsI18nKey.responsesDefaults)).toBeInTheDocument();
  });

  test('Should hide responses defaults when the model cannot serve Responses', () => {
    renderProperties();

    expect(defaultsHeading(EntityFieldsI18nKey.responsesDefaults)).not.toBeInTheDocument();
  });

  test('Should always show completion defaults, which are not gated', () => {
    renderProperties();

    expect(defaultsHeading(EntityFieldsI18nKey.completionDefaults)).toBeInTheDocument();
  });
});
