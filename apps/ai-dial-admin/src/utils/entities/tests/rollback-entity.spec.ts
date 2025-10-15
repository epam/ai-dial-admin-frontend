import { UpdateI18nKey } from '@/src/constants/i18n';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { describe, expect, it } from 'vitest';
import {
  getRollbackErrorDescription,
  getRollbackErrorTitle,
  getRollbackSuccessDescription,
  getRollbackSuccessTitle,
} from '../rollback-entity';

describe('Rollback :: utils', () => {
  const tWithProps = (str: string, props?: Record<string, string>) => str + ' with props';

  it('getRollbackSuccessTitle returns a string', () => {
    expect(getRollbackSuccessTitle(ActivityAuditResourceType.INTERCEPTOR, tWithProps)).toBe(
      `${UpdateI18nKey.NotificationTitle} with props`,
    );
  });

  it('getRollbackSuccessDescription returns a string', () => {
    expect(getRollbackSuccessDescription(ActivityAuditResourceType.INTERCEPTOR, tWithProps)).toBe(
      `${UpdateI18nKey.NotificationDescription} with props`,
    );
  });

  it('getRollbackErrorTitle returns a string', () => {
    expect(getRollbackErrorTitle(ActivityAuditResourceType.INTERCEPTOR, tWithProps)).toBe(
      `${UpdateI18nKey.NotificationTitle} with props`,
    );
  });

  it('getRollbackErrorDescription returns a string', () => {
    expect(getRollbackErrorDescription(ActivityAuditResourceType.INTERCEPTOR, tWithProps)).toBe(
      `${UpdateI18nKey.NotificationDescription} with props`,
    );
  });
});
