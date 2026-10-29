'use server';

import { cookies, headers } from 'next/headers';

import { coreOrgUnitsApi, filesCoreApi } from '@/src/app/api/api';
import { DialFolder } from '@/src/models/dial/folder';
import { NewOrgUnit, NewOrgUnitRoleAssignment } from '@/src/models/dial/org-unit';
import { DialRule } from '@/src/models/dial/rule';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { ConflictResolutionPolicy } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';
import { ApplicationRoute } from '@/src/types/routes';
import {
  changeFolderCore,
  getFoldersCore,
  getRulesCore,
  removeFolderCore,
  removeSkillFolderCore,
  updateRulesCore,
} from '@/src/server/folders/folders-core';

export async function getFolders(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const tree = await getFoldersCore(token, path);
  return (tree?.items as DialFolder[] | undefined) || [];
}

export async function getRules(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return getRulesCore(token, path);
}

export async function updateRules(targetFolder: string, rules: DialRule[]) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return updateRulesCore(token, targetFolder, rules);
}

export async function createFolderWithFiles(body: FormData, _type?: string, _view?: ApplicationRoute) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const config = JSON.parse(await (body.get('config') as Blob).text()) as {
    path: string;
    conflictResolutionStrategy: string;
  };
  const file = body.getAll('files')[0] as File;
  const overwrite = config.conflictResolutionStrategy === ConflictResolutionPolicy.OVERRIDE;
  return filesCoreApi.uploadFile(token, `${config.path}${file.name}`, file, { overwrite });
}

export async function removeFolder(path: string, resourceType: ResourceType) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return removeFolderCore(token, path, [resourceType]);
}

/**
 * Deletes a Skill grouping folder. Kept separate from `removeFolder`/`removeFolderCore` rather than
 * adding `ResourceType.SKILL` to that call: Skills aren't one of the five flat resource types
 * `removeFolderCore` walks generically, so they get their own dedicated Core path instead.
 */
export async function removeSkillFolder(path: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return removeSkillFolderCore(token, path);
}

export async function changeFolder(oldPath: string, newPath: string, resourceType: ResourceType, overwrite?: boolean) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return changeFolderCore(token, oldPath, newPath, [resourceType], overwrite);
}

export async function getOrgUnits() {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return coreOrgUnitsApi.listUnits(token);
}

export async function createOrgUnit(parentPath: string, unit: NewOrgUnit) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return coreOrgUnitsApi.createUnit(token, parentPath, unit);
}

export async function renameOrgUnit(unitPath: string, displayName: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return coreOrgUnitsApi.renameUnit(token, unitPath, displayName);
}

export async function deleteOrgUnit(unitPath: string, recursive = false) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return coreOrgUnitsApi.deleteUnit(token, unitPath, recursive);
}

export async function getOrgUnitRoles(unitPath: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return coreOrgUnitsApi.listRoles(token, unitPath);
}

export async function getOrgUnitAssignments(unitPath: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return coreOrgUnitsApi.listAssignments(token, unitPath);
}

export async function addOrgUnitAssignment(unitPath: string, assignment: NewOrgUnitRoleAssignment) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return coreOrgUnitsApi.addAssignment(token, unitPath, assignment);
}

export async function removeOrgUnitAssignment(unitPath: string, assignmentId: string) {
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  return coreOrgUnitsApi.removeAssignment(token, unitPath, assignmentId);
}
