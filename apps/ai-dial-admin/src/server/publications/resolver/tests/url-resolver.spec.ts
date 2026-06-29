import { PublicationStatus } from '@/src/models/dial/publications';
import { CorePublicationResource, CoreResourceAction } from '@/src/server/publications/models';
import { describe, expect, test } from 'vitest';
import { resolveResourceUrl } from '../url-resolver';

const resource = (action: CoreResourceAction): CorePublicationResource => ({
  action,
  sourceUrl: 'source',
  targetUrl: 'target',
  reviewUrl: 'review',
});

describe('Server :: Publications :: resolveResourceUrl', () => {
  test('ADD uses review/target/source by status', () => {
    const add = resource(CoreResourceAction.ADD);
    expect(resolveResourceUrl(add, PublicationStatus.PENDING)).toBe('review');
    expect(resolveResourceUrl(add, PublicationStatus.APPROVED)).toBe('target');
    expect(resolveResourceUrl(add, PublicationStatus.REJECTED)).toBe('source');
  });

  test('ADD_IF_ABSENT behaves like ADD', () => {
    const addIfAbsent = resource(CoreResourceAction.ADD_IF_ABSENT);
    expect(resolveResourceUrl(addIfAbsent, PublicationStatus.PENDING)).toBe('review');
    expect(resolveResourceUrl(addIfAbsent, PublicationStatus.APPROVED)).toBe('target');
    expect(resolveResourceUrl(addIfAbsent, PublicationStatus.REJECTED)).toBe('source');
  });

  test('DELETE always uses targetUrl regardless of status', () => {
    const del = resource(CoreResourceAction.DELETE);
    expect(resolveResourceUrl(del, PublicationStatus.PENDING)).toBe('target');
    expect(resolveResourceUrl(del, PublicationStatus.APPROVED)).toBe('target');
    expect(resolveResourceUrl(del, PublicationStatus.REJECTED)).toBe('target');
  });

  test('falls back to empty string when the chosen url is missing', () => {
    expect(resolveResourceUrl({ action: CoreResourceAction.ADD }, PublicationStatus.PENDING)).toBe('');
    expect(resolveResourceUrl({ action: CoreResourceAction.DELETE }, PublicationStatus.APPROVED)).toBe('');
  });
});
