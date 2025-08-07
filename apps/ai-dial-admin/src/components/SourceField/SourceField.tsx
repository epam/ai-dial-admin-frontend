import { FC, useState } from 'react';

import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { Container } from '@/src/models/deployments';
import { SOURCE_ITEMS } from '@/src/components/SourceField/constants';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import Endpoints from '@/src/components/SourceField/Endpoints/Endpoints';
import Containers from '@/src/components/SourceField/Containers/Containers';
import Templates from '@/src/components/SourceField/Template/Templates';

interface Props {
  interceptor: DialInterceptor;
  onChange: (interceptor: DialInterceptor) => void;
  getContainers: () => Promise<Container[] | null>;
  getRunners: () => Promise<InterceptorTemplate[] | null>;
}

const SourceField: FC<Props> = ({ interceptor, onChange, getContainers, getRunners }) => {
  const [source, setSource] = useState(interceptor.source?.$type || SOURCE_ITEMS[0].id);

  return (
    <div className="flex flex-col gap-6 mt-3">
      <div className="max-w-fit">
        <DropdownField
          items={SOURCE_ITEMS}
          onChange={(source) => {
            setSource(source as SOURCE_TYPE);
            onChange({ ...interceptor, source: { ...interceptor.source, $type: source as SOURCE_TYPE } });
          }}
          elementId={'sourceType'}
          selectedValue={source}
        />
      </div>

      {source === SOURCE_TYPE.ENDPOINTS && <Endpoints entity={interceptor} onChange={onChange} />}
      {source === SOURCE_TYPE.CONTAINER && (
        <Containers entity={interceptor} onChange={onChange} getContainers={getContainers} />
      )}
      {source === SOURCE_TYPE.RUNNER && <Templates entity={interceptor} onChange={onChange} getRunners={getRunners} />}
    </div>
  );
};

export default SourceField;
