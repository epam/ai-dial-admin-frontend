import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  buildResourceTypeLabelMap,
  formatAttachment,
  formatCpuColumnValue,
  formatGpuColumnValue,
  formatMemoryColumnValue,
  formatRequired,
  getCpuColumnValue,
  getFormattedResourceType,
  getGpuColumnValue,
  getMemoryColumnValue,
  getTopics,
  numberValueFormatter,
  priceValueFormatter,
  sourceTypeFormatter,
  sourceValueFormatter,
  toNumberOrNull,
} from '../formatters';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { SOURCE_FIELD, SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ApplicationRoute } from '@/src/types/routes';
import { AttachmentsI18nKey, BasicI18nKey, EntitiesI18nKey, MenuI18nKey, SourceI18nKey } from '@/src/constants/i18n';

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

  test('Should return Adapter container label for AdapterDeployment', () => {
    const res = getFormattedResourceType(ActivityAuditResourceType.ADAPTER_DEPLOYMENT, t);
    expect(res).toBe(EntitiesI18nKey.AdapterContainer);
  });

  test('Should return Application container label for ApplicationDeployment', () => {
    const res = getFormattedResourceType(ActivityAuditResourceType.APPLICATION_DEPLOYMENT, t);
    expect(res).toBe(EntitiesI18nKey.ApplicationContainer);
  });

  test('Should return Interceptor container label for InterceptorDeployment', () => {
    const res = getFormattedResourceType(ActivityAuditResourceType.INTERCEPTOR_DEPLOYMENT, t);
    expect(res).toBe(EntitiesI18nKey.InterceptorContainer);
  });

  test('Should return MCP container label for McpDeployment', () => {
    const res = getFormattedResourceType(ActivityAuditResourceType.MCP_DEPLOYMENT, t);
    expect(res).toBe(EntitiesI18nKey.McpContainer);
  });

  test('Should flatten NimDeployment to Model serving label', () => {
    const res = getFormattedResourceType(ActivityAuditResourceType.NIM_DEPLOYMENT, t);
    expect(res).toBe(EntitiesI18nKey.ModelServingLabel);
  });

  test('Should flatten InferenceDeployment to Model serving label', () => {
    const res = getFormattedResourceType(ActivityAuditResourceType.INFERENCE_DEPLOYMENT, t);
    expect(res).toBe(EntitiesI18nKey.ModelServingLabel);
  });

  test('Should flatten AdapterImageDefinition to Image label', () => {
    const res = getFormattedResourceType(ActivityAuditResourceType.ADAPTER_IMAGE_DEFINITION, t);
    expect(res).toBe(EntitiesI18nKey.Image);
  });

  test('Should flatten ApplicationImageDefinition to Image label', () => {
    const res = getFormattedResourceType(ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION, t);
    expect(res).toBe(EntitiesI18nKey.Image);
  });

  test('Should flatten InterceptorImageDefinition to Image label', () => {
    const res = getFormattedResourceType(ActivityAuditResourceType.INTERCEPTOR_IMAGE_DEFINITION, t);
    expect(res).toBe(EntitiesI18nKey.Image);
  });

  test('Should flatten McpImageDefinition to Image label', () => {
    const res = getFormattedResourceType(ActivityAuditResourceType.MCP_IMAGE_DEFINITION, t);
    expect(res).toBe(EntitiesI18nKey.Image);
  });

  test('Should return Global firewall label for ImageBuildDomainWhitelist', () => {
    const res = getFormattedResourceType(ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST, t);
    expect(res).toBe(EntitiesI18nKey.GlobalFirewall);
  });
});

describe('Formatters :: buildResourceTypeLabelMap', () => {
  test('maps each lowercased localized label to the matching enum value(s)', () => {
    const map = buildResourceTypeLabelMap(t);

    expect(map[EntitiesI18nKey.GlobalFirewall.toLowerCase()]).toEqual([
      ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
    ]);
    expect(map[EntitiesI18nKey.AdapterContainer.toLowerCase()]).toEqual([ActivityAuditResourceType.ADAPTER_DEPLOYMENT]);
    expect(map[EntitiesI18nKey.AppRunner.toLowerCase()]).toEqual([ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA]);
  });

  test('groups multiple enum values that share a single label', () => {
    const map = buildResourceTypeLabelMap(t);

    expect(new Set(map[EntitiesI18nKey.ModelServingLabel.toLowerCase()])).toEqual(
      new Set([ActivityAuditResourceType.NIM_DEPLOYMENT, ActivityAuditResourceType.INFERENCE_DEPLOYMENT]),
    );
    expect(new Set(map[EntitiesI18nKey.Image.toLowerCase()])).toEqual(
      new Set([
        ActivityAuditResourceType.ADAPTER_IMAGE_DEFINITION,
        ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION,
        ActivityAuditResourceType.INTERCEPTOR_IMAGE_DEFINITION,
        ActivityAuditResourceType.MCP_IMAGE_DEFINITION,
      ]),
    );
  });

  test('falls back to the raw enum value as the label when no custom mapping exists', () => {
    const map = buildResourceTypeLabelMap(t);

    expect(map[ActivityAuditResourceType.MODEL.toLowerCase()]).toEqual([ActivityAuditResourceType.MODEL]);
    expect(map[ActivityAuditResourceType.ROLE.toLowerCase()]).toEqual([ActivityAuditResourceType.ROLE]);
  });

  test('rebuilds with a different translation function (locale change)', () => {
    const altT = (key: string) => `xx:${key}`;
    const map = buildResourceTypeLabelMap(altT);

    expect(map[`xx:${EntitiesI18nKey.GlobalFirewall}`.toLowerCase()]).toEqual([
      ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
    ]);
  });
});

describe('Formatters :: formatAttachment ', () => {
  test('Should return custom', () => {
    const result = formatAttachment('custom');
    expect(result).toEqual('custom');
  });

  test('Should return custom', () => {
    const result = formatAttachment(['*/*'] as any);
    expect(result).toEqual('*/*');
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

  test('formats source value for SCHEMA type', () => {
    expect(
      sourceValueFormatter({
        source: { $type: SOURCE_TYPE.SCHEMA, applicationTypeSchemaId: 'urn:runner:my-runner' },
      } as any),
    ).toBe('urn:runner:my-runner');
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
    expect(sourceTypeFormatter(SOURCE_TYPE.CONTAINER, t, ApplicationRoute.Applications)).toBe(
      SourceI18nKey.ApplicationContainer,
    );
  });

  test('formats source type for SCHEMA type', () => {
    expect(sourceTypeFormatter(SOURCE_TYPE.SCHEMA, t)).toBe(EntitiesI18nKey.AppRunner);
    expect(sourceTypeFormatter(SOURCE_TYPE.SCHEMA, t, ApplicationRoute.Applications)).toBe(EntitiesI18nKey.AppRunner);
  });

  test('formats source type for unknown type', () => {
    expect(sourceTypeFormatter('UNKNOWN' as SOURCE_TYPE, t)).toBe('UNKNOWN');
  });
});

describe('formatRequired', () => {
  test('returns translated Required when value is truthy', () => {
    const t = (key: string) => key;
    const res = formatRequired('non-empty', t);
    expect(res).toBe(BasicI18nKey.Required);
  });

  test('returns translated Optional when value is falsy', () => {
    const t = (key: string) => key;
    const res = formatRequired('', t);
    expect(res).toBe(BasicI18nKey.Optional);
  });
});

describe('Formatters :: container resource columns', () => {
  describe('toNumberOrNull', () => {
    test('returns null for undefined, null, and empty string', () => {
      expect(toNumberOrNull(undefined)).toBeNull();
      expect(toNumberOrNull(null)).toBeNull();
      expect(toNumberOrNull('')).toBeNull();
    });

    test('returns the parsed number for numeric strings', () => {
      expect(toNumberOrNull('0')).toBe(0);
      expect(toNumberOrNull('42')).toBe(42);
      expect(toNumberOrNull('0.5')).toBe(0.5);
    });

    test('passes through numbers unchanged', () => {
      expect(toNumberOrNull(0)).toBe(0);
      expect(toNumberOrNull(123)).toBe(123);
    });

    test('returns null for non-numeric strings', () => {
      expect(toNumberOrNull('NaN')).toBeNull();
      expect(toNumberOrNull('abc')).toBeNull();
    });
  });

  describe('getCpuColumnValue', () => {
    test('returns null when no value is set', () => {
      expect(getCpuColumnValue(undefined)).toBeNull();
      expect(getCpuColumnValue('')).toBeNull();
    });

    test('converts cores to millicores', () => {
      expect(getCpuColumnValue('2')).toBe(2000);
      expect(getCpuColumnValue('0.5')).toBe(500);
    });

    test('handles zero', () => {
      expect(getCpuColumnValue('0')).toBe(0);
    });
  });

  describe('getMemoryColumnValue', () => {
    test('returns null when no value is set', () => {
      expect(getMemoryColumnValue(undefined)).toBeNull();
      expect(getMemoryColumnValue('')).toBeNull();
    });

    test('converts bytes to Mb', () => {
      expect(getMemoryColumnValue(`${4 * 1024 * 1024 * 1024}`)).toBe(4096);
      expect(getMemoryColumnValue(`${512 * 1024 * 1024}`)).toBe(512);
    });

    test('rounds sub-megabyte values to zero', () => {
      expect(getMemoryColumnValue('1024')).toBe(0);
    });

    test('handles very large memory values', () => {
      expect(getMemoryColumnValue(`${1024 * 1024 * 1024 * 1024}`)).toBe(1024 * 1024);
    });
  });

  describe('getGpuColumnValue', () => {
    test('returns null when no value is set', () => {
      expect(getGpuColumnValue(undefined)).toBeNull();
      expect(getGpuColumnValue('')).toBeNull();
    });

    test('parses integer GPU counts', () => {
      expect(getGpuColumnValue('1')).toBe(1);
      expect(getGpuColumnValue('8')).toBe(8);
    });

    test('parses zero', () => {
      expect(getGpuColumnValue('0')).toBe(0);
    });
  });

  describe('formatters render null as empty and non-null with the expected suffix', () => {
    test('formatCpuColumnValue', () => {
      expect(formatCpuColumnValue(null)).toBe('');
      expect(formatCpuColumnValue(500)).toBe('500 m');
      expect(formatCpuColumnValue(0)).toBe('0 m');
    });

    test('formatMemoryColumnValue', () => {
      expect(formatMemoryColumnValue(null)).toBe('');
      expect(formatMemoryColumnValue(4096)).toBe('4096 Mb');
      expect(formatMemoryColumnValue(0)).toBe('0 Mb');
    });

    test('formatGpuColumnValue', () => {
      expect(formatGpuColumnValue(null)).toBe('');
      expect(formatGpuColumnValue(1)).toBe('1');
      expect(formatGpuColumnValue(0)).toBe('0');
    });
  });
});
