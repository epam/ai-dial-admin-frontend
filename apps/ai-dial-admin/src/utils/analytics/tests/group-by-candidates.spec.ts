import { describe, expect, test } from 'vitest';

import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { getGroupByCandidates } from '@/src/utils/analytics/group-by-candidates';

const field = (name: string, source = name) => ({ name, source, type: AnalyticsFieldType.String });

describe('getGroupByCandidates', () => {
  // The bare key is only accepted where the source declares it as a column of its own.
  test('offers the bare grain key when the source declares it', () => {
    const fields = [field('client_session_id'), field('response_id')];

    expect(getGroupByCandidates(fields, 'client_session_id')).toEqual(['client_session_id']);
  });

  // An enrichment-sourced field is namespaced by the enrichment and keeps its backing name bare.
  test('offers the qualified spelling when the key comes through an enrichment', () => {
    const fields = [field('response_id'), field('usage_client_identity.client_session_id', 'client_session_id')];

    expect(getGroupByCandidates(fields, 'client_session_id')).toEqual(['usage_client_identity.client_session_id']);
  });

  test('offers both spellings when the source has the column and an enrichment repeats it', () => {
    const fields = [field('client_session_id'), field('usage_client_identity.client_session_id', 'client_session_id')];

    expect(getGroupByCandidates(fields, 'client_session_id')).toEqual([
      'client_session_id',
      'usage_client_identity.client_session_id',
    ]);
  });

  test('offers nothing when no field reaches the grain key', () => {
    expect(getGroupByCandidates([field('response_id')], 'client_session_id')).toEqual([]);
  });

  test('offers nothing while the target has no grain key', () => {
    expect(getGroupByCandidates([field('client_session_id')], undefined)).toEqual([]);
  });

  // A field whose last segment merely resembles the key is a different column of a different enrichment.
  test('ignores a qualified field whose last segment is another column', () => {
    const fields = [field('usage_client_identity.client_id', 'client_id')];

    expect(getGroupByCandidates(fields, 'client_session_id')).toEqual([]);
  });
});
