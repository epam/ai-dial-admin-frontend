import { describe, expect, test } from 'vitest';

import { AliasHealthReason, ConfigHealthSkippedEntity } from '@/src/models/dial/config-health';
import { findAliasHealthIssue, getAliasHealthIds } from '../health';

const skipped: ConfigHealthSkippedEntity[] = [
  { id: 'aliases/assistant-v1', reason: AliasHealthReason.TargetMissing },
  { id: 'aliases/public/search', reason: AliasHealthReason.TargetIncompatible },
  { id: 'aliases/platform/dup', reason: 'Duplicate deployment ID: dup' },
  { id: 'models/other', reason: 'broken' },
];

describe('getAliasHealthIds', () => {
  test('is the config spelling, and the platform URL, for a config or platform alias', () => {
    expect(getAliasHealthIds('assistant-v1', false)).toEqual(['aliases/assistant-v1', 'aliases/platform/assistant-v1']);
  });

  test('is the stored URL for a public alias', () => {
    expect(getAliasHealthIds('search', true)).toEqual(['aliases/public/search']);
  });
});

describe('findAliasHealthIssue', () => {
  test('finds a config or platform alias by its bare id', () => {
    expect(findAliasHealthIssue(skipped, 'assistant-v1', false)).toEqual(skipped[0]);
  });

  test('finds a public alias by its URL', () => {
    expect(findAliasHealthIssue(skipped, 'search', true)).toEqual(skipped[1]);
  });

  test('finds a platform alias skipped as a duplicate under its canonical URL', () => {
    expect(findAliasHealthIssue(skipped, 'dup', false)).toEqual(skipped[2]);
  });

  test('does not mix the two buckets up when a name is shared', () => {
    expect(findAliasHealthIssue(skipped, 'search', false)).toBeUndefined();
    expect(findAliasHealthIssue(skipped, 'assistant-v1', true)).toBeUndefined();
  });

  test('ignores an entity of another type that happens to share the name', () => {
    expect(findAliasHealthIssue(skipped, 'other', false)).toBeUndefined();
  });

  test('is undefined for a healthy alias or a missing report', () => {
    expect(findAliasHealthIssue(skipped, 'healthy', false)).toBeUndefined();
    expect(findAliasHealthIssue([], 'assistant-v1', false)).toBeUndefined();
    expect(findAliasHealthIssue(undefined, 'assistant-v1', false)).toBeUndefined();
  });
});
