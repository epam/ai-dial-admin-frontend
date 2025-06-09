import {
  getDeleteOperation,
  getDuplicateOperation,
  getMoveOperation,
  getOpenInNewTabOperation,
  getRemoveOperation,
  getResetOperation,
  getSetNoLimitsOperation,
} from '../entity-operations';
import { IconTrashX, IconFolderShare, IconCopy, IconInfinity, IconTrash, IconExternalLink } from '@tabler/icons-react';

import Reset from '@/public/images/icons/reset.svg';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { EntityOperation } from '@/src/types/entity-operations';

const CLICK = jest.fn();

describe('Server :: Entity Operations', () => {
  it('Should set DELETE_OPERATION', () => {
    const res = getDeleteOperation(CLICK);
    expect(res.id).toBe(EntityOperation.Delete);
    expect(res.icon).toEqual(<IconTrashX {...BASE_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  it('Should set DUPLICATE_OPERATION', () => {
    const res = getDuplicateOperation(CLICK);
    expect(res.id).toBe(EntityOperation.Duplicate);
    expect(res.icon).toEqual(<IconCopy {...BASE_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  it('Should set OPEN_NEW_TAB_OPERATION', () => {
    const res = getOpenInNewTabOperation(CLICK);
    expect(res.id).toBe(EntityOperation.Open_in_new_tab);
    expect(res.icon).toEqual(<IconExternalLink {...BASE_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  it('Should set REMOVE_OPERATION', () => {
    const res = getRemoveOperation(CLICK);
    expect(res.id).toBe(EntityOperation.Remove);
    expect(res.icon).toEqual(<IconTrash {...BASE_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  it('Should set RESET_TO_DEFAULT_OPERATION', () => {
    const res = getResetOperation(CLICK);
    expect(res.id).toBe(EntityOperation.Reset_to_default_limits);
    expect(res.icon).toEqual(<Reset />);
    expect(res.onClick).toEqual(CLICK);
  });

  it('Should set SET_NO_LIMITS_OPERATION', () => {
    const res = getSetNoLimitsOperation(CLICK);
    expect(res.id).toBe(EntityOperation.Set_no_limits);
    expect(res.icon).toEqual(<IconInfinity {...BASE_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  it('Should set MOVE_OPERATION', () => {
    const res = getMoveOperation(CLICK);
    expect(res.id).toBe(EntityOperation.Move);
    expect(res.icon).toEqual(<IconFolderShare {...BASE_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });
});
