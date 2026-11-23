'use client';

import { Spinner } from '@epam/ai-dial-ui-kit';
import { FC, lazy, Suspense } from 'react';

import { EntitySelectType, PickedEntity } from './models';
import PublicEntityTree from './PublicEntityTree';

// The tabbed picker reads the Platform and config.json grids, which pull in every entity's list actions. It is
// loaded on demand so a picker that only browses one tree (a skill, a file) never carries them.
const TabbedEntityPicker = lazy(() => import('./TabbedEntityPicker'));

interface Props {
  entityType: EntitySelectType;
  /** The selected entity's path as its tree lists it (`<bucket>/<path>`), without the resource prefix. */
  value: string;
  isModalOpen: boolean;
  /** Single-selection mode: reports the one selected entity, or `null` when nothing selectable is. */
  onChangeSelectedPath?: (path: string | null) => void;
  /** Multi-selection mode over a single tree: reports every selected entity, never a grouping folder. */
  onChangeSelectedPaths?: (paths: string[]) => void;
  /** Multi-selection over every source the entity has (Public tree, Platform, config.json), tab by tab. */
  onChangeSelectedEntities?: (entities: PickedEntity[]) => void;
  /** Single selection over the same sources: a pick on one tab replaces a pick on another; `null` when none. */
  onChangeSelectedEntity?: (entity: PickedEntity | null) => void;
}

const EntitySelectManager: FC<Props> = ({ onChangeSelectedEntities, onChangeSelectedEntity, ...treeProps }) => {
  // An entity that is browsed on its own (a skill, a file) never passes a multi-source callback, so it is just
  // its tree. Whoever passes one wants every source the entity has, which for a model is no tree at all.
  if (!onChangeSelectedEntities && !onChangeSelectedEntity) {
    return <PublicEntityTree {...treeProps} />;
  }

  return (
    <Suspense fallback={<Spinner size={40} fullWidth />}>
      <TabbedEntityPicker
        {...treeProps}
        onChangeSelectedEntities={onChangeSelectedEntities}
        onChangeSelectedEntity={onChangeSelectedEntity}
      />
    </Suspense>
  );
};

export default EntitySelectManager;
