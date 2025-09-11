import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  formatAttachment,
  getFormattedResourceType,
  numberValueFormatter,
  priceValueFormatter,
  sourceTypeFormatter,
  sourceValueFormatter,
} from '../formatters';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ApplicationRoute } from '@/src/types/routes';
import { EntitiesI18nKey, SourceI18nKey } from '@/src/constants/i18n';

const t = (s: string) => s;

describe('Formatters :: getFormattedResourceType', () => {
  test('Should return Application Runner', () => {
    const res = getFormattedResourceType(ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA, t);
    expect(res).toBe(EntitiesI18nKey.AppRunner);
  });

  test('Should return Application Runner', () => {
    const res = getFormattedResourceType(ActivityAuditResourceType.INTERCEPTOR_TEMPLATE, t);
    expect(res).toBe(EntitiesI18nKey.InterceptorTemplate);
  });

  test('Should return Application', () => {
    const res = getFormattedResourceType(ActivityAuditResourceType.APPLICATION, t);
    expect(res).toBe('Application');
  });
});

describe('Formatters :: formatAttachment ', () => {
  test('Should return custom', () => {
    const result = formatAttachment('custom', (v: string) => v);
    expect(result).toEqual('custom');
  });

  test('Should return custom', () => {
    const result = formatAttachment(['*/*'] as any, (v: string) => v);
    expect(result).toEqual('Attachments.AllAttachments');
  });
});

describe('Formatters :: numberValueFormatter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  test('formats number from params.data using colDef.field', () => {
    const params = {
      data: { amount: 12345 },
      colDef: { field: 'amount' },
    } as any;
    expect(numberValueFormatter(params)).toBe('12,345');
  });

  test('returns empty string if params.data is missing', () => {
    const params = {
      data: undefined,
      colDef: { field: 'amount' },
    } as any;
    expect(numberValueFormatter(params)).toBe('');
  });

  test('returns empty string if colDef.field is missing', () => {
    const params = {
      data: { amount: 12345 },
      colDef: {},
    } as any;
    expect(numberValueFormatter(params)).toBe('');
  });
});

describe('Formatters :: priceValueFormatter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  test('formats number from params.data using colDef.field', () => {
    const params = {
      data: { price: 12345 },
      colDef: { field: 'price' },
    } as any;
    expect(priceValueFormatter(params)).toBe('12345');
  });

  test('returns empty string if params.data is missing', () => {
    const params = {
      data: undefined,
      colDef: { field: 'price' },
    } as any;
    expect(priceValueFormatter(params)).toBe('');
  });

  test('returns empty string if colDef.field is missing', () => {
    const params = {
      data: { amount: 12345 },
      colDef: {},
    } as any;
    expect(priceValueFormatter(params)).toBe('');
  });
});

describe('Formatters :: sourceValueFormatter', () => {
  test('formats source value for ADAPTER type', () => {
    const params = {
      data: { source: { $type: SOURCE_TYPE.ADAPTER, adapterName: 'Adapter1' } },
      colDef: { field: 'source' },
    } as any;
    expect(sourceValueFormatter(params)).toBe('Adapter1');
  });

  test('formats source value for CONTAINER type', () => {
    const params = {
      data: { source: { $type: SOURCE_TYPE.CONTAINER, containerId: 'Container1' } },
      colDef: { field: 'source' },
    } as any;
    expect(sourceValueFormatter(params)).toBe('Container1');
  });

  test('formats source value for RUNNER type', () => {
    const params = {
      data: { source: { $type: SOURCE_TYPE.RUNNER, runnerName: 'Runner1' } },
      colDef: { field: 'source' },
    } as any;
    expect(sourceValueFormatter(params)).toBe('Runner1');
  });

  test('formats source value for ENDPOINT type', () => {
    const params = {
      data: { source: { $type: SOURCE_TYPE.ENDPOINTS, runnerName: 'Runner1' }, endpoint: 'http://example.com' },
      colDef: { field: 'source' },
    } as any;
    expect(sourceValueFormatter(params)).toBe('http://example.com');
  });

  test('formats source value for not exist type', () => {
    const params = {
      data: { source: { $type: 'UNKNOWN', name: 'Unknown1' } },
      value: 'default value',
      colDef: { field: 'source' },
    } as any;
    expect(sourceValueFormatter(params)).toBe('default value');
  });

  test('formats source value for missing source type', () => {
    const params = {
      data: { source: {} },
      value: 'default value',
      colDef: { field: 'source' },
    } as any;
    expect(sourceValueFormatter(params)).toBe('default value');
  });
});

describe('Formatters :: sourceTypeFormatter', () => {
  test('formats source type for ADAPTER type', () => {
    expect(sourceTypeFormatter(SOURCE_TYPE.ADAPTER, t)).toBe(SourceI18nKey.Adapter);
  });

  test('formats source type for RUNNER type', () => {
    expect(sourceTypeFormatter(SOURCE_TYPE.RUNNER, t)).toBe(SourceI18nKey.InterceptorTemplate);
  });

  test('formats source type for ENDPOINT type', () => {
    expect(sourceTypeFormatter(SOURCE_TYPE.ENDPOINTS, t)).toBe(SourceI18nKey.Endpoint);
  });

  test('formats source type for CONTAINER type', () => {
    expect(sourceTypeFormatter(SOURCE_TYPE.CONTAINER, t, ApplicationRoute.Interceptors)).toBe(
      SourceI18nKey.InterceptorDeployment,
    );
    expect(sourceTypeFormatter(SOURCE_TYPE.CONTAINER, t, ApplicationRoute.Models)).toBe(SourceI18nKey.ModelDeployment);
  });

  test('formats source type for unknown type', () => {
    expect(sourceTypeFormatter('UNKNOWN' as SOURCE_TYPE, t)).toBe('UNKNOWN');
  });
});
