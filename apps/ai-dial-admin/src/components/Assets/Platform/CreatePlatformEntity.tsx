'use client';

import { FC, ReactNode } from 'react';

import { getResolvedRunnerSchema } from '@/src/app/[lang]/platform-app-runners/actions';
import { getCatalogSchemaById } from '@/src/app/[lang]/platform-catalog-schemas/actions';
import CreateApplication from '@/src/components/Assets/Entities/Apps/CreateApplication';
import { CreateAssetActionMap, PlatformCreateAssetActionMap } from '@/src/components/Assets/BaseAssetList/utils';
import { CreateAssetRoute } from '@/src/components/Assets/BaseAssetList/types';
import CreateKeyModal from '@/src/components/Assets/Platform/Keys/CreateKeyModal';
import CreatePolicyModal from '@/src/components/Assets/Platform/PolicySubjects/CreatePolicyModal';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialApplicationResource } from '@/src/models/dial/resource';
import { ServerActionResponse } from '@/src/models/server-action';
import type { ResourceInfo } from '@/src/server/core/asset-metadata';
import { ApplicationRoute } from '@/src/types/routes';
import CreatePlatformEntityForm from './CreatePlatformEntityForm';
import { toPlatformInitialValues } from './utils';

interface Props {
  view: ApplicationRoute;
  isOpen: boolean;
  names: string[];
  runners?: DialApplicationScheme[];
  translators?: ResourceInfo[];
  /** Seeds the form, e.g. from the app runner or MCP container the entity is created for. */
  initialValues?: Partial<AssetWithVersion>;
  /** Rendered above the form, for an entry point that lets the user choose the destination. */
  topSlot?: ReactNode;
  onClose: () => void;
}

const ENTITY_BY_ID_GETTERS: Partial<Record<ApplicationRoute, (id: string) => Promise<ServerActionResponse>>> = {
  [ApplicationRoute.PlatformAppRunners]: getResolvedRunnerSchema,
  [ApplicationRoute.PlatformCatalogSchemas]: getCatalogSchemaById,
};

/**
 * The one create popup for a listing's Platform tab. Needs no folder context: a platform resource has no
 * folder and no version, and the popup writes it to the flat `platform/` bucket through the view's create action.
 */
const CreatePlatformEntity: FC<Props> = ({
  view,
  isOpen,
  names,
  runners,
  translators,
  initialValues,
  topSlot,
  onClose,
}) => {
  const createEntity = (PlatformCreateAssetActionMap[view] ?? CreateAssetActionMap[view as CreateAssetRoute]) as (
    entity: AssetWithVersion,
  ) => Promise<ServerActionResponse>;
  const seed = toPlatformInitialValues(initialValues);

  switch (view) {
    case ApplicationRoute.PlatformKeys:
      return <CreateKeyModal isOpen={isOpen} names={names} onClose={onClose} />;
    case ApplicationRoute.PlatformPolicies:
    case ApplicationRoute.PlatformPolicyAssignments:
      return <CreatePolicyModal route={view} isOpen={isOpen} names={names} onClose={onClose} onCreate={createEntity} />;
    case ApplicationRoute.AssetsApplications:
      return (
        <CreateApplication
          isPlatform
          isOpen={isOpen}
          names={names}
          runners={runners}
          translators={translators}
          initialValues={seed as Partial<DialApplicationResource>}
          topSlot={topSlot}
          onClose={onClose}
          onCreate={createEntity}
        />
      );
    default:
      return (
        <CreatePlatformEntityForm
          view={view}
          isOpen={isOpen}
          names={names}
          initialValues={seed}
          topSlot={topSlot}
          createEntity={createEntity}
          getEntityById={ENTITY_BY_ID_GETTERS[view]}
          onClose={onClose}
        />
      );
  }
};

export default CreatePlatformEntity;
