import { IconRefresh } from '@tabler/icons-react';

import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { EntityOperation } from '@/src/types/entity-operations';
import { getResourceRollbackOperation } from '../actions';

const CLICK = jest.fn();

describe('Actions :: getResourceRollbackOperation', () => {
  it('Should set Rollback operation', () => {
    const res = getResourceRollbackOperation(CLICK);
    expect(res.id).toBe(EntityOperation.Resource_rollback);
    expect(res.icon).toEqual(<IconRefresh {...BASE_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });
});
