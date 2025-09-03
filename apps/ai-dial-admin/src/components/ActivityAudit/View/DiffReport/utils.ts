import { NO_LIMITS_KEY } from '@/src/constants/role';
import { ActivityAuditDiff, ActivityAuditDiffSection } from '@/src/models/activity-audit';
import { ActivityAuditResourceType, DiffStatus, DiffView } from '@/src/types/activity-audit';
import { EntityParameterKeys } from '@/src/components/ActivityAudit/constants';

export const roleLimitsKeys = ['minute', 'day', 'week', 'month'];
export const roleShareLimitsKeys = ['maxAcceptedUsers', 'invitationTtl'];

const getRowDataByParameter = (
  data?: ActivityAuditDiff[],
  parameter?: string,
  index?: number,
  type?: ActivityAuditResourceType,
) => {
  if (parameter === EntityParameterKeys.ROLES && (index === 1 || type === ActivityAuditResourceType.ROLE)) {
    return data?.map((item) => {
      const valueMap: Record<string, string> = {};
      item.value.split(',').forEach((pair) => {
        const [key, val] = pair.split(':').map((s) => s.trim());
        valueMap[key] = val;
      });

      const newObj: Record<string, string> = {
        ...item,
      };

      if (item.parameter) {
        roleLimitsKeys.forEach((key) => {
          newObj[key] = valueMap[key] || NO_LIMITS_KEY;
        });
        roleShareLimitsKeys.forEach((key) => {
          newObj[key] = valueMap[key] || NO_LIMITS_KEY;
        });
      }

      return newObj as unknown as ActivityAuditDiff;
    });
  }
  return data;
};

/**
 * Calculate number of changes in diff section
 *
 * @param {ActivityAuditDiffSection[]} sections - section where need to check changes
 * @param {?DiffStatus} [status] - status which need to check
 * @returns {number} - result of status changes count
 */
export const getDiffCount = (sections: ActivityAuditDiffSection[], status?: DiffStatus): number => {
  let count = 0;

  sections.forEach((section) => {
    Object.values(section).forEach((arr) => {
      if (Array.isArray(arr)) {
        arr.forEach((item) => {
          if (item.status === status) {
            count++;
          }
        });
      }
    });
  });
  return status === DiffStatus.CHANGED ? count / 2 : count;
};

/**
 * Filter compare section to return section if it has any data
 *
 * @param {ActivityAuditDiffSection[]} sections - initial sections
 * @param {string} name - section title
 * @param {?DiffView} [diffView] - variable to control showing only changes or all values
 * @param {?ActivityAuditResourceType} [type] - resource type
 * @returns {*} - sections data compare and current with index
 */
export const filterNotEmptySections = (
  sections: ActivityAuditDiffSection[],
  name: string,
  diffView?: DiffView,
  type?: ActivityAuditResourceType,
) => {
  return sections.reduce<{ index: number; currentData?: ActivityAuditDiff[]; compareData?: ActivityAuditDiff[] }[]>(
    (acc, item, index) => {
      const current = getRowDataByParameter(item.current, name, index, type);
      const compare = getRowDataByParameter(item.compare, name, index, type);

      const currentData = diffView === DiffView.ALL ? current : current?.filter((d) => d.status);
      const compareData = diffView === DiffView.ALL ? compare : compare?.filter((d) => d.status);

      const hasData = (currentData && currentData.length > 0) || (compareData && compareData.length > 0);

      if (hasData) {
        acc.push({ index, currentData, compareData });
      }

      return acc;
    },
    [],
  );
};
