import { ApplicationCreationAsset } from '@/src/components/Assets/Entities/Apps/models';
import { ASSET_APPLICATION_INTERFACES_SOURCE_TYPE } from '@/src/components/SourceField/constants';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DEFAULT_NEW_ENTITY_VERSION } from '@/src/constants/dial-base-entity';
import { DialApplicationResource } from '@/src/models/dial/resource';
import { CODE_APP_SOURCE_TYPE } from '@/src/utils/entities/application-source';
import { isValidEndpoint } from '@/src/utils/validation/url-error';

export const getInitialApplicationAsset = (
  folderId: string,
  isPlatform: boolean,
  initialValues?: Partial<DialApplicationResource>,
): DialApplicationResource =>
  ({
    name: '',
    displayName: '',
    description: '',
    interfaces: {},
    folderId,
    ...(isPlatform ? { user_roles: [] } : { version: DEFAULT_NEW_ENTITY_VERSION }),
    ...initialValues,
  }) as DialApplicationResource;

export const isApplicationCreationSourceValid = (
  asset: ApplicationCreationAsset,
  source: string,
  codeAppEditorUrl?: string,
): boolean => {
  switch (source) {
    case ASSET_APPLICATION_INTERFACES_SOURCE_TYPE:
      return Object.keys(asset.interfaces ?? {}).length > 0;
    case SOURCE_TYPE.SCHEMA:
      return !!asset.application_type_schema_id;
    case CODE_APP_SOURCE_TYPE:
      return !!codeAppEditorUrl;
    case SOURCE_TYPE.ENDPOINTS:
      return (
        (!!asset.endpoint && isValidEndpoint(asset.endpoint)) ||
        (!!asset.mcp?.endpoint && isValidEndpoint(asset.mcp.endpoint))
      );
    default:
      return false;
  }
};
