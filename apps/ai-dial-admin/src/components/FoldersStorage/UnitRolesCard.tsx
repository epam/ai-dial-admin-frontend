'use client';

import { FC, useMemo } from 'react';

import { Tag, TagAppearance } from '@epam/ai-dial-ui-kit';

import AddHolderForm from '@/src/components/FoldersStorage/AddHolderForm';
import { DraftHolder } from '@/src/components/FoldersStorage/models';
import { FoldersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { OrgUnitRole, OrgUnitSubject, SubjectKind } from '@/src/models/dial/org-unit';
import { classifySubject } from '@/src/utils/org-units/subjects';

interface Props {
  roles: OrgUnitRole[];
  holders: DraftHolder[];
  groupClaim: string;
  isReadonly?: boolean;
  onAdd: (roleName: string, subject: OrgUnitSubject) => void;
  onRemove: (key: string) => void;
}

const UnitRolesCard: FC<Props> = ({ roles, holders, groupClaim, isReadonly, onAdd, onRemove }) => {
  const t = useI18n();

  const sections = useMemo(() => {
    const known = new Set(roles.map((role) => role.name));
    const orphanRoles = [...new Set(holders.map((holder) => holder.roleName))].filter((name) => !known.has(name));
    return [...roles, ...orphanRoles.map((name) => ({ name }) as OrgUnitRole)];
  }, [roles, holders]);

  return (
    <div className="flex flex-col gap-4 min-w-0 overflow-auto">
      {sections.map((role) => {
        const roleHolders = holders.filter((holder) => holder.roleName === role.name && !holder.isRemoved);
        return (
          <section
            key={role.name}
            role="group"
            aria-label={role.name}
            className="flex flex-col gap-3 bg-layer-2 py-4 px-6 rounded min-w-0"
          >
            <div className="flex flex-col gap-1 min-w-0">
              <h3 className="truncate">{role.name}</h3>
              {role.description && <span className="dial-tiny-text text-secondary">{role.description}</span>}
            </div>
            <div className="flex flex-row flex-wrap gap-2">
              {roleHolders.length === 0 && (
                <span className="dial-small-text text-secondary">{t(FoldersI18nKey.NoHolders)}</span>
              )}
              {roleHolders.map((holder) => {
                const { kind, label } = classifySubject(holder.subject, groupClaim);
                const text = kind === SubjectKind.EVERYONE ? t(FoldersI18nKey.HolderEveryone) : label;
                return (
                  <Tag
                    key={holder.key}
                    label={text}
                    appearance={TagAppearance.Bordered}
                    closable={!isReadonly}
                    removeLabel={t(FoldersI18nKey.RemoveHolder, { holder: text })}
                    onRemove={() => onRemove(holder.key)}
                  />
                );
              })}
            </div>
            {!isReadonly && <AddHolderForm roleName={role.name} groupClaim={groupClaim} onAdd={onAdd} />}
          </section>
        );
      })}
    </div>
  );
};

export default UnitRolesCard;
