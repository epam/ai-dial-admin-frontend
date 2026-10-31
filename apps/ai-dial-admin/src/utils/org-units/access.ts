import { UnitAction, UnitNamespace, UserOrgUnit } from '@/src/models/user-access';
import { getOwningUnit, toUnitMap } from '@/src/utils/org-units/units';

const grants = (unit: UserOrgUnit | undefined, namespace: UnitNamespace, action: UnitAction): boolean =>
  unit?.permissions?.[namespace]?.includes(action) ?? false;

/** Whether any unit grants `read` on the namespace — what shows a menu section. */
export const canReadNamespace = (units: UserOrgUnit[], namespace: UnitNamespace): boolean =>
  units.some((unit) => grants(unit, namespace, UnitAction.READ));

/** Whether the unit owning `path` grants `action`; a path no unit owns grants nothing. */
export const hasActionAt = (
  units: UserOrgUnit[],
  namespace: UnitNamespace,
  action: UnitAction,
  path: string,
): boolean => grants(getOwningUnit(toUnitMap(units), path), namespace, action);

export const canWriteAt = (units: UserOrgUnit[], namespace: UnitNamespace, path: string): boolean =>
  hasActionAt(units, namespace, UnitAction.WRITE, path);

/** `read` and `write` on `publications` at the unit owning every one of `paths`; no paths grants nothing. */
export const canDecidePublicationAt = (units: UserOrgUnit[], paths: string[]): boolean =>
  paths.length > 0 &&
  paths.every(
    (path) =>
      hasActionAt(units, UnitNamespace.PUBLICATIONS, UnitAction.READ, path) &&
      hasActionAt(units, UnitNamespace.PUBLICATIONS, UnitAction.WRITE, path),
  );
