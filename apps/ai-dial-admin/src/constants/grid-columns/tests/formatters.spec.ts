import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  formatAttachment,
  formatRequired,
  getFormattedResourceType,
  getTopics,
  numberValueFormatter,
  priceValueFormatter,
  sourceTypeFormatter,
  sourceValueFormatter,
} from '../formatters';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { SOURCE_FIELD, SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ApplicationRoute } from '@/src/types/routes';
import { BasicI18nKey, EntitiesI18nKey, MenuI18nKey, SourceI18nKey } from '@/src/constants/i18n';

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

  test('Should return System Properties', () => {
    const res = getFormattedResourceType(ActivityAuditResourceType.SYSTEM_PROPERTIES, t);
    expect(res).toBe(MenuI18nKey.SystemProperties);
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

describe('Formatters :: getTopics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  test('returns empty array', () => {
    expect(getTopics({})).toEqual(null);
    expect(getTopics()).toEqual(null);
    expect(getTopics({ topics: [] })).toEqual(null);
  });

  test('returns topics array', () => {
    expect(getTopics({ descriptionKeywords: ['topic1', 'topic2'] })).toEqual(['topic1', 'topic2']);
    expect(getTopics({ topics: ['topic1', 'topic2'] })).toEqual(['topic1', 'topic2']);
  });
});

describe('Formatters :: numberValueFormatter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  test('formats number from data', () => {
    expect(numberValueFormatter('12345')).toBe('12,345');
    expect(numberValueFormatter(12345)).toBe('12,345');
  });

  test('returns empty string if data is missing or invalid', () => {
    expect(numberValueFormatter(undefined)).toBe('');
    expect(numberValueFormatter('dd' as any)).toBe('');
  });
});

describe('Formatters :: priceValueFormatter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  test('formats number from data', () => {
    expect(priceValueFormatter(12345)).toBe('12345');
    expect(priceValueFormatter(12345)).toBe('12345');
  });

  test('returns empty string if data is missing', () => {
    expect(priceValueFormatter(undefined)).toBe('');
  });
});

describe('Formatters :: sourceValueFormatter', () => {
  test('return empty value', () => {
    expect(sourceValueFormatter({ source: {} as SOURCE_FIELD })).toBeUndefined();
  });
  test('formats source value for ADAPTER type', () => {
    expect(sourceValueFormatter({ source: { $type: SOURCE_TYPE.ADAPTER, adapterName: 'Adapter1' } })).toBe('Adapter1');
  });

  test('formats source value for CONTAINER type', () => {
    expect(sourceValueFormatter({ source: { $type: SOURCE_TYPE.CONTAINER, containerId: 'Container1' } })).toBe(
      'Container1',
    );
  });

  test('formats source value for RUNNER type', () => {
    expect(sourceValueFormatter({ source: { $type: SOURCE_TYPE.RUNNER, runnerName: 'Runner1' } })).toBe('Runner1');
  });

  test('formats source value for ENDPOINT type', () => {
    expect(
      sourceValueFormatter({
        source: { $type: SOURCE_TYPE.ENDPOINTS, runnerName: 'Runner1' },
        endpoint: 'http://example.com',
      }),
    ).toBe('http://example.com');
  });

  test('formats source value for ENDPOINT type in Adapter view', () => {
    expect(
      sourceValueFormatter(
        {
          source: { $type: SOURCE_TYPE.ENDPOINTS, runnerName: 'Runner1' },
          baseEndpoint: 'http://example.com',
        },
        '',
        ApplicationRoute.Adapters,
      ),
    ).toBe('http://example.com');
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
    expect(sourceTypeFormatter(SOURCE_TYPE.ENDPOINTS, t, ApplicationRoute.Models)).toBe(SourceI18nKey.ExternalEndpoint);
  });

  test('formats source type for CONTAINER type', () => {
    expect(sourceTypeFormatter(SOURCE_TYPE.CONTAINER, t, ApplicationRoute.Interceptors)).toBe(
      SourceI18nKey.InterceptorContainer,
    );
    expect(sourceTypeFormatter(SOURCE_TYPE.CONTAINER, t, ApplicationRoute.Models)).toBe(SourceI18nKey.ModelServing);

    expect(sourceTypeFormatter(SOURCE_TYPE.CONTAINER, t, ApplicationRoute.Toolsets)).toBe(SourceI18nKey.McpContainer);
    expect(sourceTypeFormatter(SOURCE_TYPE.CONTAINER, t, ApplicationRoute.Applications)).toBe(SOURCE_TYPE.CONTAINER);
  });

  test('formats source type for unknown type', () => {
    expect(sourceTypeFormatter('UNKNOWN' as SOURCE_TYPE, t)).toBe('UNKNOWN');
  });
});

describe('formatRequired', () => {
  test('returns translated Yes when value is truthy', () => {
    const t = (key: string) => key;
    const res = formatRequired('non-empty', t);
    expect(res).toBe(BasicI18nKey.Yes);
  });

  test('returns translated No when value is falsy', () => {
    const t = (key: string) => key;
    const res = formatRequired('', t);
    expect(res).toBe(BasicI18nKey.No);
  });
});
