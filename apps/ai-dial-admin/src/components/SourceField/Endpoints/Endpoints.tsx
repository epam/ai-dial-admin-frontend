import { ApplicationRoute } from '@/src/types/routes';
import ModelEndpoint from '@/src/components/SourceField/Endpoints/ModelEndpoint';
import { DialModel } from '@/src/models/dial/model';
import ToolsetEndpoint from '@/src/components/SourceField/Endpoints/ToolsetEndpoint';
import { Toolset } from '@/src/models/dial/toolset';
import InterceptorEndpoint from '@/src/components/SourceField/Endpoints/InterceptorEndpoint';
import { DialInterceptor } from '@/src/models/dial/interceptor';

interface Props<T> {
  entity: T;
  onChange: (entity: T) => void;
  view?: ApplicationRoute;
  isModal?: boolean;
  prefix?: string;
}

const Endpoints = <T extends object>({ entity, onChange, view, isModal, prefix }: Props<T>) => {
  return (
    <>
      {view === ApplicationRoute.Models && (
        <ModelEndpoint
          entity={entity}
          onChange={onChange as (entity: DialModel) => void}
          isModal={isModal}
          prefix={prefix}
        />
      )}
      {view === ApplicationRoute.Toolsets && (
        <ToolsetEndpoint
          entity={entity as Toolset}
          disabled={true}
          onChange={onChange as (entity: Toolset) => void}
          isModal={isModal}
          prefix={prefix}
        />
      )}
      {view === ApplicationRoute.Interceptors && (
        <InterceptorEndpoint
          entity={entity}
          onChange={onChange as (entity: DialInterceptor) => void}
          prefix={prefix}
          isModal={isModal}
        />
      )}
    </>
  );
};

export default Endpoints;
