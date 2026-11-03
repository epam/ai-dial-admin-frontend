import { describe, expect, test } from 'vitest';

import { getDashboardWriteErrorNotification } from '@/src/components/Analytics/CustomDashboards/utils/write-error';
import { CustomDashboardsI18nKey } from '@/src/constants/i18n';

const t = (key: string) => key;

describe('getDashboardWriteErrorNotification', () => {
  test('says the dashboard changed elsewhere on a stale write', () => {
    expect(
      getDashboardWriteErrorNotification(
        { success: false, status: 409, errorMessage: 'generation 3', requestId: 'r' },
        t,
      ),
    ).toEqual(
      expect.objectContaining({
        title: CustomDashboardsI18nKey.ChangedElsewhere,
        description: CustomDashboardsI18nKey.ChangedElsewhereHint,
        requestId: 'r',
      }),
    );
  });

  test('passes any other refusal through with the service header and message', () => {
    expect(
      getDashboardWriteErrorNotification({ success: false, status: 422, errorHeader: 'h', errorMessage: 'bad row' }, t),
    ).toEqual(expect.objectContaining({ title: 'h', description: 'bad row' }));
  });
});
