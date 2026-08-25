import DeploymentProperties from '@/src/components/EntityMainProperties/Properties/DeploymentProperties';
import EntityProperties from '@/src/components/EntityMainProperties/Properties/EntityProperties';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';
import { isAssetView } from '@/src/utils/is-view';
import AppRunnerCreateProperties from '@/src/components/Assets/AppRunners/CreateProperties';
import RouteCreateProperties from '@/src/components/Assets/Routes/CreateProperties';
import SkillCreateProperties from '@/src/components/Assets/Skills/CreateProperties';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
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
  isModal?: boolean;
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
  // Ahead of `isSimpleEntity`, which defaults to `true` for unlisted routes — an app runner is
  // identified by `$id`, so the generic `name`-based form would silently drop its identity.
  if (view === ApplicationRoute.AssetsAppRunners) {
    return (
      <AppRunnerCreateProperties
        entity={entity as DialAppRunnerResource}
        names={props.names}
        isModal={props.isModal}
        onChangeEntity={props.onChangeEntity}
      />
    );
  }

  if (view === ApplicationRoute.AssetsSkills) {
    return (
      <SkillCreateProperties
        entity={entity as { name?: string; description?: string }}
        names={props.names}
        onChangeEntity={props.onChangeEntity}
      />
    );
  }

  // Ahead of `isSimpleEntity` for the same reason as App Runner above: the generic `EntityProperties`
  // form always renders a display-name field and seeds a `description`, neither of which exists on
  // `Route` (see `RouteCreateProperties`'s doc comment).
  if (view === ApplicationRoute.AssetsRoutes) {
    return (
      <RouteCreateProperties
        entity={entity as { name?: string }}
        names={props.names}
        isUniqueNameError={isUniqueNameError}
        onChangeEntity={props.onChangeEntity}
      />
    );
  }

  if (isSimpleEntity(view)) {
    return <EntityProperties entity={entity} view={view} isUniqueNameError={isUniqueNameError} {...props} />;
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
