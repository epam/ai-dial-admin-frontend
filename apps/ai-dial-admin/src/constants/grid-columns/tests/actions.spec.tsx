import OpenPopup from '@/public/images/icons/open-pop-up.svg';

import {
  IconCopy,
  IconDownload,
  IconExternalLink,
  IconEye,
  IconFolderShare,
  IconInfinity,
  IconReload,
  IconReplace,
  IconTrash,
  IconTrashX,
  IconPlayerPlay,
  IconPlayerPause,
  IconRefreshDot,
  IconPencilMinus,
} from '@tabler/icons-react';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ActionMenuOperation } from '@/src/types/action-menu-operations';
import { describe, expect, test, vi } from 'vitest';
import {
  getCompareChangesOperation,
  getDeleteOperation,
  getDuplicateOperation,
  getMoveOperation,
  getOpenInNewTabOperation,
  getRemoveOperation,
  getResetOperation,
  getResourceRollbackOperation,
  getSetNoLimitsOperation,
  getViewDetailsOperation,
  getDownloadOperation,
  getPreviewOperation,
  getRunOperation,
  getStopOperation,
  getTryOutOperation,
  getEditOperation,
} from '../actions';

import { CONTAINER_STATUS } from '@/src/types/deployments/containers';

const CLICK = vi.fn();

describe('Actions :: getResourceRollbackOperation', () => {
  test('Should set Rollback operation', () => {
    const res = getResourceRollbackOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Resource_rollback);
    expect(res.icon).toEqual(<IconRefreshDot {...BASE_BUTTON_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set DELETE_OPERATION', () => {
    const res = getDeleteOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Delete);
    expect(res.icon).toEqual(<IconTrashX {...BASE_BUTTON_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set DUPLICATE_OPERATION', () => {
    const res = getDuplicateOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Duplicate);
    expect(res.icon).toEqual(<IconCopy {...BASE_BUTTON_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set OPEN_NEW_TAB_OPERATION', () => {
    const res = getOpenInNewTabOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Open_in_new_tab);
    expect(res.icon).toEqual(<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set REMOVE_OPERATION', () => {
    const res = getRemoveOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Remove);
    expect(res.icon).toEqual(<IconTrash {...BASE_BUTTON_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

    test('Should set EDIT_OPERATION', () => {
    const res = getEditOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Edit);
    expect(res.icon).toEqual(<IconPencilMinus {...BASE_BUTTON_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set RESET_TO_DEFAULT_OPERATION', () => {
    const res = getResetOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Reset_to_default_limits);
    expect(res.icon).toEqual(<IconReload {...BASE_BUTTON_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set SET_NO_LIMITS_OPERATION', () => {
    const res = getSetNoLimitsOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Set_no_limits);
    expect(res.icon).toEqual(<IconInfinity {...BASE_BUTTON_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set MOVE_OPERATION', () => {
    const res = getMoveOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Move);
    expect(res.icon).toEqual(<IconFolderShare {...BASE_BUTTON_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set VIEW_DETAILS_OPERATION', () => {
    const res = getViewDetailsOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.View_details);
    expect(res.icon).toEqual(<OpenPopup {...BASE_BUTTON_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set VIEW_DETAILS_OPERATION', () => {
    const res = getDownloadOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Download);
    expect(res.icon).toEqual(<IconDownload {...BASE_BUTTON_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set Download', () => {
    const res = getPreviewOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Preview);
    expect(res.icon).toEqual(<IconEye {...BASE_BUTTON_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set COMPARE_CHANGES_OPERATION', () => {
    const res = getCompareChangesOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Compare_changes);
    expect(res.icon).toEqual(<IconReplace {...BASE_BUTTON_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });

  test('Should set RUN_OPERATION and hidden behaviour', () => {
    const res = getRunOperation(CLICK as any);
    expect(res.id).toBe(ActionMenuOperation.Run);
    expect(res.icon).toEqual(<IconPlayerPlay {...BASE_BUTTON_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);

    expect(typeof res.hidden).toBe('function');
    const hidden = res.hidden as any;

    const nodeRunning = { data: { status: CONTAINER_STATUS.RUNNING } } as any;
    const nodePending = { data: { status: CONTAINER_STATUS.PENDING } } as any;
    const nodeFailed = { data: { status: CONTAINER_STATUS.FAILED } } as any;
    const nodeOther = { data: { status: 'OTHER' } } as any;

    expect(hidden({} as any, nodeRunning)).toBe(true);
    expect(hidden({} as any, nodePending)).toBe(true);
    expect(hidden({} as any, nodeFailed)).toBe(true);
    expect(hidden({} as any, nodeOther)).toBe(false);
  });

  test('Should set STOP_OPERATION and hidden behaviour', () => {
    const res = getStopOperation(CLICK as any);
    expect(res.id).toBe(ActionMenuOperation.Stop);
    expect(res.icon).toEqual(<IconPlayerPause {...BASE_BUTTON_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);

    expect(typeof res.hidden).toBe('function');
    const hidden = res.hidden as any;

    const nodeRunning = { data: { status: CONTAINER_STATUS.RUNNING } } as any;
    const nodePending = { data: { status: CONTAINER_STATUS.PENDING } } as any;
    const nodeFailed = { data: { status: CONTAINER_STATUS.FAILED } } as any;
    const nodeOther = { data: { status: 'OTHER' } } as any;

    // stop hidden should be false (visible) for RUNNING/PENDING/FAILED
    expect(hidden({} as any, nodeRunning)).toBe(false);
    expect(hidden({} as any, nodePending)).toBe(false);
    expect(hidden({} as any, nodeFailed)).toBe(false);
    // and true for other statuses
    expect(hidden({} as any, nodeOther)).toBe(true);
  });

  test('Should set TRY_OUT_OPERATION', () => {
    const res = getTryOutOperation(CLICK);
    expect(res.id).toBe(ActionMenuOperation.Try_out);
    expect(res.icon).toEqual(<IconPlayerPlay className="text-success" {...BASE_BUTTON_ICON_PROPS} />);
    expect(res.onClick).toEqual(CLICK);
  });
});
