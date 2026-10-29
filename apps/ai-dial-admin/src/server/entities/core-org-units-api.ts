import {
  CORE_ORG_UNITS_ASSIGNMENTS_SEGMENT,
  CORE_ORG_UNITS_ROLES_SEGMENT,
  CORE_ORG_UNITS_URL,
} from '@/src/constants/org-units-core';
import { Token } from '@/src/models/auth';
import {
  NewOrgUnit,
  NewOrgUnitRoleAssignment,
  OrgUnit,
  OrgUnitAssignmentDeleteResponse,
  OrgUnitDeleteResponse,
  OrgUnitList,
  OrgUnitRoleAssignment,
  OrgUnitRoleAssignmentList,
  OrgUnitRoleList,
} from '@/src/models/dial/org-unit';
import { ServerActionResponse } from '@/src/models/server-action';
import { CoreApi } from '@/src/server/core/core-api';
import { encodeCorePath } from '@/src/server/publications/path';

/** `BaseApi` hands a DELETE body back as text; Core answers these with JSON. */
const parseDeleteBody = <T extends object>(res: ServerActionResponse): ServerActionResponse<T> => {
  if (!res.success || typeof res.response !== 'string') {
    return res;
  }
  try {
    return { ...res, response: JSON.parse(res.response) as T };
  } catch {
    return { ...res, response: undefined };
  }
};

/**
 * Client for DIAL Core's org-units API (`/v1/org-units/public…`). `unitPath` is the decoded unit
 * `path` Core returns (`public/Acme/Risk`); an empty/`public` path addresses the shared space itself.
 * Every call answers 404 when org units are switched off in Core.
 */
export class CoreOrgUnitsApi extends CoreApi {
  listUnits(token: Token): Promise<ServerActionResponse<OrgUnitList>> {
    return this.getAction(`${CORE_ORG_UNITS_URL}?recursive=true`, token);
  }

  getUnit(token: Token, unitPath: string): Promise<ServerActionResponse<OrgUnit>> {
    return this.getAction(this.unitUrl(unitPath), token);
  }

  /** Creates under the shared space or the unit at `parentPath`. */
  createUnit(token: Token, parentPath: string, unit: NewOrgUnit): Promise<ServerActionResponse<OrgUnit>> {
    return this.postAction(this.unitUrl(parentPath), unit, token);
  }

  renameUnit(token: Token, unitPath: string, displayName: string): Promise<ServerActionResponse<OrgUnit>> {
    return this.patchAction(this.unitUrl(unitPath), { displayName }, token);
  }

  async deleteUnit(
    token: Token,
    unitPath: string,
    recursive = false,
  ): Promise<ServerActionResponse<OrgUnitDeleteResponse>> {
    const query = recursive ? '?recursive=true' : '';
    return parseDeleteBody(await this.deleteAction(`${this.unitUrl(unitPath)}${query}`, token));
  }

  listRoles(token: Token, unitPath: string): Promise<ServerActionResponse<OrgUnitRoleList>> {
    return this.getAction(`${this.unitUrl(unitPath)}/${CORE_ORG_UNITS_ROLES_SEGMENT}`, token);
  }

  listAssignments(token: Token, unitPath: string): Promise<ServerActionResponse<OrgUnitRoleAssignmentList>> {
    return this.getAction(`${this.unitUrl(unitPath)}/${CORE_ORG_UNITS_ASSIGNMENTS_SEGMENT}`, token);
  }

  addAssignment(
    token: Token,
    unitPath: string,
    assignment: NewOrgUnitRoleAssignment,
  ): Promise<ServerActionResponse<OrgUnitRoleAssignment>> {
    return this.postAction(`${this.unitUrl(unitPath)}/${CORE_ORG_UNITS_ASSIGNMENTS_SEGMENT}`, assignment, token);
  }

  async removeAssignment(
    token: Token,
    unitPath: string,
    assignmentId: string,
  ): Promise<ServerActionResponse<OrgUnitAssignmentDeleteResponse>> {
    return parseDeleteBody(
      await this.deleteAction(
        `${this.unitUrl(unitPath)}/${CORE_ORG_UNITS_ASSIGNMENTS_SEGMENT}/${encodeURIComponent(assignmentId)}`,
        token,
      ),
    );
  }

  /** `public/Acme/Risk` → `v1/org-units/public/Acme/Risk`; the leading `public` is already in the base URL. */
  private unitUrl(unitPath: string): string {
    const segments = unitPath.split('/').filter(Boolean);
    const rest = segments[0] === 'public' ? segments.slice(1) : segments;
    return rest.length ? `${CORE_ORG_UNITS_URL}/${encodeCorePath(rest.join('/'))}` : CORE_ORG_UNITS_URL;
  }
}
