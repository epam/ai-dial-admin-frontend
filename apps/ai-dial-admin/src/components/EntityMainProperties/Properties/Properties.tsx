import DeploymentProperties from '@/src/components/EntityMainProperties/Properties/DeploymentProperties';
import EntityProperties from '@/src/components/EntityMainProperties/Properties/EntityProperties';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';
import { isAssetView } from '@/src/utils/is-asset-view';
import AssetProperties from './AssetProperties';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';

interface Props<T> {
  view: ApplicationRoute;
  entity: T;
  names: string[];
  versionsMap?: Record<string, string[]>;
  runners?: DialApplicationScheme[];
  isUniqueNameError?: boolean;
  isEntityImmutable?: boolean;
  onChangeEntity: (entity: object) => void;
  initialValues?: Partial<T>;
}

// TODO: remove this component and use EntityProperties and DeploymentProperties directly in the views

const Properties = <T extends object>({
  view,
  runners,
  isUniqueNameError,
  versionsMap,
  entity,
  ...props
}: Props<T>) => {
  if (isSimpleEntity(view)) {
    return <EntityProperties entity={entity} view={view} {...props} />;
  }

  if (isAssetView(view)) {
    return (
      <AssetProperties
        view={view}
        runners={runners}
        versionsMap={versionsMap}
        entity={entity as AssetWithVersion}
        {...props}
      />
    );
  }

  return (
    <DeploymentProperties
      entity={entity}
      view={view}
      runners={runners}
      isUniqueNameError={isUniqueNameError}
      {...props}
    />
  );
};

export default Properties;
