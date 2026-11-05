import { describe, expect, test } from 'vitest';

import { PolicyKind, PolicyQuantity, PolicySubjectFunction } from '@/src/models/dial/policy';
import { toAssignmentPayload, toPolicyPayload } from '@/src/utils/policies/payload';

const METADATA = { name: 'cap', path: 'team-a/cap', folderId: 'team-a/' };

describe('toPolicyPayload', () => {
  test('drops identity, the folder, and fields the generic create form seeds', () => {
    const payload = toPolicyPayload({
      name: 'cap',
      folderId: 'platform/team-a/',
      id: 'cap',
      description: '',
      createdAt: '1',
      updatedAt: '2',
      _metadata: METADATA,
      priority: 10,
      object: '*',
      cost: { day: 5 },
    });

    expect(payload).toEqual({
      priority: 10,
      object: '*',
      cost: { day: 5 },
      kind: PolicyKind.BUDGET,
      quantity: PolicyQuantity.COST,
      per: ['subject'],
    });
  });

  test('always sends per as subject and defaults kind and quantity', () => {
    const payload = toPolicyPayload({ name: 'cap', per: ['other'] } as never);

    expect(payload.per).toEqual(['subject']);
    expect(payload.kind).toBe(PolicyKind.BUDGET);
    expect(payload.quantity).toBe(PolicyQuantity.COST);
  });

  test('omits a blank cost object and an empty subject list', () => {
    const payload = toPolicyPayload({ name: 'cap', costObject: '  ', subject: [] });

    expect(payload).not.toHaveProperty('costObject', '  ');
    expect(payload.costObject).toBeUndefined();
    expect(payload.subject).toBeUndefined();
  });

  test('keeps a set cost object and subject rules', () => {
    const subject = [{ source: 'roles', function: PolicySubjectFunction.EQUAL, targets: ['admin'] }];
    const payload = toPolicyPayload({ name: 'cap', costObject: 'team-a', subject });

    expect(payload.costObject).toBe('team-a');
    expect(payload.subject).toEqual(subject);
  });

  test('never sends the reserved fields', () => {
    const payload = toPolicyPayload({ name: 'cap', _metadata: METADATA });

    expect(Object.keys(payload)).not.toEqual(
      expect.arrayContaining(['id', 'attachedTo', 'harness', 'broker', 'packages']),
    );
  });
});

describe('toAssignmentPayload', () => {
  test('takes the cost object from the folder the assignment is stored in', () => {
    const payload = toAssignmentPayload({ name: 'grant-1', folderId: 'platform/team-a/', policy: 'daily-cap' });

    expect(payload).toEqual({ policy: 'daily-cap', costObject: 'team-a' });
  });

  test('falls back to the merged read metadata folder', () => {
    const payload = toAssignmentPayload({ name: 'grant-1', policy: 'daily-cap', _metadata: METADATA });

    expect(payload.costObject).toBe('team-a');
  });

  test('omits empty optional fields', () => {
    const payload = toAssignmentPayload({
      name: 'grant-1',
      folderId: 'team-a/',
      policy: 'daily-cap',
      ticket: '',
      source: ' ',
      description: '',
      expiresAt: '',
      subject: [],
    });

    expect(payload).toEqual({ policy: 'daily-cap', costObject: 'team-a' });
  });

  test('keeps the optional fields that are set', () => {
    const payload = toAssignmentPayload({
      name: 'grant-1',
      folderId: 'team-a/',
      policy: 'daily-cap',
      ticket: 'T-1',
      expiresAt: '2027-01-01T00:00:00Z',
    });

    expect(payload.ticket).toBe('T-1');
    expect(payload.expiresAt).toBe('2027-01-01T00:00:00Z');
  });
});
