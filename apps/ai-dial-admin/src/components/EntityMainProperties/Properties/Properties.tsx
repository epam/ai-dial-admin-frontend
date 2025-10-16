import DeploymentProperties from '@/src/components/EntityMainProperties/Properties/DeploymentProperties';
import EntityProperties from '@/src/components/EntityMainProperties/Properties/EntityProperties';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';
import { isAssetView } from '@/src/utils/is-asset-view';
import AssetProperties from './AssetProperties';

interface Props<T> {
  view: ApplicationRoute;
  entity: T;
  names: string[];
  versionsMap?: Record<string, string[]>;
  runners?: DialApplicationScheme[];
  initialValues?: Partial<T>;
  isUniqueNameError?: boolean;
  isEntityImmutable?: boolean;
  onChangeEntity: (entity: object) => void;
}

const Properties = <T extends object>({
  view,
  runners,
  initialValues,
  isUniqueNameError,
  versionsMap,
  ...props
}: Props<T>) => {
  if (isSimpleEntity(view)) {
    return <EntityProperties view={view} {...props} />;
  }

  if (isAssetView(view)) {
    return (
      <AssetProperties
        view={view}
        runners={runners}
        versionsMap={versionsMap}
        initialValues={initialValues}
        {...props}
      />
    );
  }

  return <DeploymentProperties view={view} runners={runners} isUniqueNameError={isUniqueNameError} {...props} />;
};

export default Properties;
