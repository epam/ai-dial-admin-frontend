import OpenPopup from '@/public/images/icons/open-pop-up.svg';

import {
  IconCopy,
  IconExternalLink,
  IconFolderShare,
  IconInfinity,
  IconRefresh,
  IconReload,
  IconTrash,
  IconTrashX,
} from '@tabler/icons-react';

import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { ActionMenuOperation } from '@/src/types/action-menu-operations';
import { describe, expect, test, vi } from 'vitest';
import {
  getDeleteOperation,
  getDuplicateOperation,
  getMoveOperation,
  getOpenInNewTabOperation,
  getRemoveOperation,
  getResetOperation,
  getResourceRollbackOperation,
  getSetNoLimitsOperation,
  getViewDetailsOperation,
} from '../actions';

const CLICK = vi.fn();

describe('Actions :: getResourceRollbackOperation', () => {
  test('Should set Rollback operation', () => {
    const res = getResourceRollbackOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Resource_rollback);
    expect(res.icon).toEqual(<IconRefresh {...BASE_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set DELETE_OPERATION', () => {
    const res = getDeleteOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Delete);
    expect(res.icon).toEqual(<IconTrashX {...BASE_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set DUPLICATE_OPERATION', () => {
    const res = getDuplicateOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Duplicate);
    expect(res.icon).toEqual(<IconCopy {...BASE_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set OPEN_NEW_TAB_OPERATION', () => {
    const res = getOpenInNewTabOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Open_in_new_tab);
    expect(res.icon).toEqual(<IconExternalLink {...BASE_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set REMOVE_OPERATION', () => {
    const res = getRemoveOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Remove);
    expect(res.icon).toEqual(<IconTrash {...BASE_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set RESET_TO_DEFAULT_OPERATION', () => {
    const res = getResetOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Reset_to_default_limits);
    expect(res.icon).toEqual(<IconReload {...BASE_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set SET_NO_LIMITS_OPERATION', () => {
    const res = getSetNoLimitsOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Set_no_limits);
    expect(res.icon).toEqual(<IconInfinity {...BASE_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set MOVE_OPERATION', () => {
    const res = getMoveOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Move);
    expect(res.icon).toEqual(<IconFolderShare {...BASE_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set VIEW_DETAILS_OPERATION', () => {
    const res = getViewDetailsOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.View_details);
    expect(res.icon).toEqual(<OpenPopup {...BASE_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });
});
