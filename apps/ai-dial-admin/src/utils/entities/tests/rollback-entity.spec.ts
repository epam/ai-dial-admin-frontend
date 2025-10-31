import { RollbackI18nKey } from '@/src/constants/i18n';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { describe, expect, test } from 'vitest';
import {
  getRollbackErrorDescription,
  getRollbackErrorTitle,
  getRollbackSuccessDescription,
  getRollbackSuccessTitle,
} from '../rollback-entity';

describe('Rollback :: utils', () => {
  const tWithProps = (str: string, props?: Record<string, string>) => str + ' with props';

  test('getRollbackSuccessTitle returns a string', () => {
    expect(getRollbackSuccessTitle(ActivityAuditResourceType.INTERCEPTOR, tWithProps)).toBe(
      `${RollbackI18nKey.NotificationSuccessTitle} with props`,
    );
  });

  test('getRollbackSuccessDescription returns a string', () => {
    expect(getRollbackSuccessDescription(ActivityAuditResourceType.INTERCEPTOR, tWithProps)).toBe(
      `${RollbackI18nKey.NotificationSuccessDescription} with props`,
    );
  });

  test('getRollbackErrorTitle returns a string', () => {
    expect(getRollbackErrorTitle(ActivityAuditResourceType.INTERCEPTOR, tWithProps)).toBe(
      `${RollbackI18nKey.NotificationErrorTitle} with props`,
    );
  });

  test('getRollbackErrorDescription returns a string', () => {
    expect(getRollbackErrorDescription(ActivityAuditResourceType.INTERCEPTOR, tWithProps)).toBe(
      `${RollbackI18nKey.NotificationErrorDescription} with props`,
    );
  });
});
