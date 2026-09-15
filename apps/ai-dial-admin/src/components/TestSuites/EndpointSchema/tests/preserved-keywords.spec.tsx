import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JSONSchema7 } from 'json-schema';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { fieldsToJsonSchema, jsonSchemaToFields } from '@/src/components/Common/SchemaGrid/utils';
import { TabsI18nKey } from '@/src/constants/i18n';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import EndpointSchema from '../EndpointSchema';

vi.mock('@/src/context/SaveValidationContext', () => ({
  useSaveValidationContext: () => ({ isValid: true, dispatch: vi.fn() }),
  ValidationActionType: { SetField: 'SET_FIELD_VALIDATION', RemoveField: 'REMOVE_FIELD_VALIDATION' },
}));

vi.mock('../Columns/Columns', () => ({ default: () => <div>Columns</div> }));

/**
 * Stands in for the grid by running its real conversion pair, so this asserts the third
 * `SchemaGrid` caller's placement AND the round-trip the previous change generalized — the
 * combination neither the grid's own util tests nor the existing `EndpointSchema` spec covers.
 */
vi.mock('@/src/components/Common/SchemaGrid/SchemaGrid', () => ({
  default: ({ schema, onChange }: { schema: JSONSchema7; onChange: (next: JSONSchema7) => void }) => (
    <button type="button" onClick={() => onChange(fieldsToJsonSchema(jsonSchemaToFields(schema)))}>
      round-trip
    </button>
  ),
}));

const decorated: JSONSchema7 = {
  type: 'object',
  properties: {
    badge: { type: 'string', format: 'dial-file-encoded', 'dial:file': true } as JSONSchema7,
    tier: { type: 'string', enum: ['gold', 'silver'], default: 'gold' },
    nested: {
      type: 'object',
      properties: {
        logo: {
          type: 'string',
          format: 'dial-file-encoded',
          'dial:file': true,
          'dial:meta': { 'dial:propertyOrder': 2, 'dial:propertyKind': 'client' },
        } as JSONSchema7,
      },
    },
  },
};

const testSuite = (schema: JSONSchema7): TestSuite =>
  ({
    name: 'suite',
    endpointRef: {
      method: 'POST',
      relativeUrlPattern: '/v1/run',
      responseBodySchema: schema,
      requestBodySchema: { contentType: 'application/json', schema },
    },
  }) as unknown as TestSuite;

const roundTrip = async (tab?: TabsI18nKey) => {
  const user = userEvent.setup();
  const onChangeTestSuite = vi.fn();
  render(<EndpointSchema testSuite={testSuite(decorated)} onChangeTestSuite={onChangeTestSuite} />);

  if (tab) {
    await user.click(screen.getByRole('tab', { name: tab }));
  }
  await user.click(screen.getByRole('button', { name: 'round-trip' }));

  return onChangeTestSuite.mock.calls[0][0] as TestSuite;
};

describe('EndpointSchema :: a grid edit preserves every schema declaration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('keeps format and dial:file on a top-level property of the response schema', async () => {
    const written = (await roundTrip()).endpointRef?.responseBodySchema as unknown as JSONSchema7;
    const badge = written.properties!.badge as JSONSchema7;

    expect(badge.format).toEqual('dial-file-encoded');
    expect(badge['dial:file' as keyof JSONSchema7]).toBe(true);
  });

  test('keeps enum and default, which the grid owns no column for', async () => {
    const written = (await roundTrip()).endpointRef?.responseBodySchema as unknown as JSONSchema7;
    const tier = written.properties!.tier as JSONSchema7;

    expect(tier.enum).toEqual(['gold', 'silver']);
    expect(tier.default).toEqual('gold');
  });

  test('keeps format, dial:file and dial:meta on a nested property', async () => {
    const written = (await roundTrip()).endpointRef?.responseBodySchema as unknown as JSONSchema7;
    const nested = written.properties!.nested as JSONSchema7;
    const logo = nested.properties!.logo as JSONSchema7;

    expect(logo.format).toEqual('dial-file-encoded');
    expect(logo['dial:file' as keyof JSONSchema7]).toBe(true);
    expect(logo['dial:meta' as keyof JSONSchema7]).toEqual({
      'dial:propertyOrder': 2,
      'dial:propertyKind': 'client',
    });
  });

  test('keeps them on the request schema too, under its own content type', async () => {
    const written = await roundTrip(TabsI18nKey.RequestSchema);
    const request = written.endpointRef?.requestBodySchema;
    const badge = (request?.schema as unknown as JSONSchema7).properties!.badge as JSONSchema7;

    expect(request?.contentType).toEqual('application/json');
    expect(badge.format).toEqual('dial-file-encoded');
  });
});
