import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getResolvedRunnerSchema } from '@/src/app/[lang]/platform-app-runners/actions';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import AppRunnerAssetParameters from '../Parameters';

vi.mock('@/src/app/[lang]/platform-app-runners/actions', () => ({
  getResolvedRunnerSchema: vi.fn(),
}));

vi.mock('@/src/components/Common/SchemaGrid/SchemaGrid', () => ({
  default: ({ isReadonly }: any) => <div>schema-grid:readonly={String(isReadonly)}</div>,
}));

const ENDPOINT = 'dial:applicationTypeSchemaEndpoint';

const runner = (overrides: Partial<DialAppRunnerResource> = {}): DialAppRunnerResource =>
  ({ $id: 'https://host/runner', ...overrides }) as DialAppRunnerResource;

describe('AppRunnerAssetParameters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Should edit the runner properties directly when no schema endpoint is declared', async () => {
    render(<AppRunnerAssetParameters runner={runner({ properties: { a: {} } })} onChange={vi.fn()} />);

    expect(await screen.findByText('schema-grid:readonly=false')).toBeInTheDocument();
    expect(getResolvedRunnerSchema).not.toHaveBeenCalled();
  });

  test('Should read the resolved schema from Core and render it read-only when an endpoint is declared', async () => {
    (getResolvedRunnerSchema as any).mockResolvedValue({ success: true, response: { properties: { b: {} } } });

    render(<AppRunnerAssetParameters runner={runner({ [ENDPOINT]: 'http://remote/schema' })} onChange={vi.fn()} />);

    expect(await screen.findByText('schema-grid:readonly=true')).toBeInTheDocument();
    expect(getResolvedRunnerSchema).toHaveBeenCalledWith('https%3A%2F%2Fhost%2Frunner');
  });

  test('Should surface an error rather than an empty parameter set when Core cannot resolve the schema', async () => {
    (getResolvedRunnerSchema as any).mockResolvedValue({
      success: false,
      errorHeader: 'Not Found',
      errorMessage: 'Failed to download application schema',
    });

    render(<AppRunnerAssetParameters runner={runner({ [ENDPOINT]: 'http://remote/schema' })} onChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(EntitiesI18nKey.ResolvedSchemaFailed)).toBeInTheDocument();
    });
    expect(screen.getByText('Failed to download application schema')).toBeInTheDocument();
    expect(screen.queryByText(EntitiesI18nKey.NoConfigurationSchema)).not.toBeInTheDocument();
  });

  test('Should show the no-parameters state when the runner genuinely has none', async () => {
    render(<AppRunnerAssetParameters runner={runner()} onChange={vi.fn()} />);

    expect(await screen.findByText(EntitiesI18nKey.NoConfigurationSchema)).toBeInTheDocument();
  });
});
