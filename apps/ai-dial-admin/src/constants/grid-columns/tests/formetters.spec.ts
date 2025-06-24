import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { formatAttachment, numberValueFormatter, getFormattedResourceType } from '../formatters';

describe('Formatters :: getFormattedResourceType', () => {
  test('Should return Application Runner', () => {
    const res = getFormattedResourceType(ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA);
    expect(res).toBe('Application Runner');
  });

  test('Should return Application', () => {
    const res = getFormattedResourceType(ActivityAuditResourceType.APPLICATION);
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
