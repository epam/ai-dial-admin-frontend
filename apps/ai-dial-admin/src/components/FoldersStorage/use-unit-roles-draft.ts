import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  addOrgUnitAssignment,
  getOrgUnitAssignments,
  getOrgUnitRoles,
  removeOrgUnitAssignment,
} from '@/src/app/[lang]/folders-storage/actions';
import { DraftHolder, RolesCardStatus } from '@/src/components/FoldersStorage/models';
import { OrgUnitRole, OrgUnitRoleAssignment, OrgUnitSubject } from '@/src/models/dial/org-unit';
import { ServerActionResponse } from '@/src/models/server-action';
import { OrgUnitErrorKind, mapOrgUnitError } from '@/src/utils/org-units/errors';
import { subjectKey } from '@/src/utils/org-units/subjects';

const holderKey = (roleName: string, subject: OrgUnitSubject) => `${roleName}|${subjectKey(subject)}`;

const toHolder = (assignment: OrgUnitRoleAssignment): DraftHolder => ({
  key: holderKey(assignment.roleName, assignment.subject),
  roleName: assignment.roleName,
  subject: assignment.subject,
  id: assignment.id,
});

export interface SaveRolesResult {
  isSuccess: boolean;
  errorMessage?: string;
}

/**
 * Local draft of a unit's role assignments. Changing `unitPath` reloads from core, which drops any
 * unsaved edits, the same as the rules editor when another folder is selected.
 */
export const useUnitRolesDraft = (unitPath: string) => {
  const [status, setStatus] = useState(RolesCardStatus.LOADING);
  const [roles, setRoles] = useState<OrgUnitRole[]>([]);
  const [stored, setStored] = useState<DraftHolder[]>([]);
  const [draft, setDraft] = useState<DraftHolder[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    const [rolesRes, assignmentsRes] = await Promise.all([getOrgUnitRoles(unitPath), getOrgUnitAssignments(unitPath)]);
    const failures = [rolesRes, assignmentsRes].filter((res) => !res.success);
    if (failures.length > 0) {
      const isForbidden = failures.some((res) => mapOrgUnitError(res).kind === OrgUnitErrorKind.FORBIDDEN);
      setStatus(isForbidden ? RolesCardStatus.FORBIDDEN : RolesCardStatus.ERROR);
      return;
    }
    const holders = (assignmentsRes.response?.items ?? []).map(toHolder);
    setRoles(rolesRes.response?.items ?? []);
    setStored(holders);
    setDraft(holders);
    setStatus(RolesCardStatus.READY);
  }, [unitPath]);

  useEffect(() => {
    setStatus(RolesCardStatus.LOADING);
    void load();
  }, [load]);

  const addHolder = useCallback((roleName: string, subject: OrgUnitSubject) => {
    const key = holderKey(roleName, subject);
    setDraft((prev) => {
      const existing = prev.find((holder) => holder.key === key);
      if (!existing) {
        return [...prev, { key, roleName, subject }];
      }
      return prev.map((holder) => (holder.key === key ? { ...holder, isRemoved: false } : holder));
    });
  }, []);

  const removeHolder = useCallback((key: string) => {
    setDraft((prev) =>
      prev.flatMap((holder) => {
        if (holder.key !== key) {
          return [holder];
        }
        return holder.id ? [{ ...holder, isRemoved: true }] : [];
      }),
    );
  }, []);

  const discard = useCallback(() => setDraft(stored), [stored]);

  const isChanged = useMemo(() => draft.some((holder) => holder.isRemoved || !holder.id), [draft]);

  /** Sends only the difference, one call at a time, and stops at the first failure; core's state is reloaded either way. */
  const save = useCallback(async (): Promise<SaveRolesResult> => {
    setIsSaving(true);
    try {
      let failure: ServerActionResponse | undefined;
      for (const holder of draft.filter((h) => !h.id)) {
        const res = await addOrgUnitAssignment(unitPath, { roleName: holder.roleName, subject: holder.subject });
        if (!res.success) {
          failure = res;
          break;
        }
      }
      if (!failure) {
        for (const holder of draft.filter((h) => h.isRemoved && h.id)) {
          const res = await removeOrgUnitAssignment(unitPath, holder.id as string);
          if (!res.success) {
            failure = res;
            break;
          }
        }
      }
      await load();
      return failure ? { isSuccess: false, errorMessage: failure.errorMessage } : { isSuccess: true };
    } catch {
      return { isSuccess: false };
    } finally {
      setIsSaving(false);
    }
  }, [draft, load, unitPath]);

  return { status, roles, draft, isChanged, isSaving, addHolder, removeHolder, discard, save };
};
