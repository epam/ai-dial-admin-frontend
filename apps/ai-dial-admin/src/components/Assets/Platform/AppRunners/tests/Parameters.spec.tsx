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
  default: ({ isReadonly, schema, onChange }: any) => (
    <div>
      <div>schema-grid:readonly={String(isReadonly)}</div>
      <button onClick={() => onChange(schema)}>emit-schema</button>
    </div>
  ),
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
    expect(getResolvedRunnerSchema).toHaveBeenCalledWith('https://host/runner');
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

  test('Should merge the grid schema into the runner without dropping its properties', async () => {
    const properties = {
      attachment: {
        type: 'string',
        format: 'dial-file-encoded',
        'dial:file': true,
        'dial:meta': { 'dial:propertyKind': 'client' },
      },
    };
    const onChange = vi.fn();

    render(
      <AppRunnerAssetParameters
        runner={runner({ properties } as Partial<DialAppRunnerResource>)}
        onChange={onChange}
      />,
    );
    (await screen.findByText('emit-schema')).click();

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ properties }), undefined);
  });

  /**
   * Deliberately unlike the catalog-schema Parameters tab, which renders its grid with no properties
   * at all. The gate this pins also covers an endpoint-owned schema that resolved empty, where the
   * grid is read-only and has nothing to add; the endpoint-less case below is the same dead end that
   * tab fixed, left to this capability's own change. A failed resolve never reaches it — the test
   * above pins that it returns `ResolvedSchemaFailed` instead.
   */
  test('Should show the no-parameters state when the runner genuinely has none', async () => {
    render(<AppRunnerAssetParameters runner={runner()} onChange={vi.fn()} />);

    expect(await screen.findByText(EntitiesI18nKey.NoConfigurationSchema)).toBeInTheDocument();
  });
});
