import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { getFormattedResourceType } from '../formatters';

describe('Formatters :: getFormattedResourceType', () => {
  it('Should return Application Runner', () => {
    const res = getFormattedResourceType(ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA);
    expect(res).toBe('Application Runner');
  });

  it('Should return Application', () => {
    const res = getFormattedResourceType(ActivityAuditResourceType.APPLICATION);
    expect(res).toBe('Application');
  });
});
