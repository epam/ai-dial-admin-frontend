import { FC, useEffect, useState } from 'react';

import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { Container } from '@/src/models/deployments';
import { SOURCE_ITEMS } from '@/src/components/SourceField/constants';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import Endpoints from '@/src/components/SourceField/Endpoints/Endpoints';
import Containers from '@/src/components/SourceField/Containers/Containers';
import Templates from '@/src/components/SourceField/Template/Templates';
import Field from '@/src/components/Common/Field/Field';

interface Props {
  interceptor: DialInterceptor;
  onChange: (interceptor: DialInterceptor) => void;
  getContainers: () => Promise<Container[] | null>;
  getRunners: () => Promise<InterceptorTemplate[] | null>;
  elementId: string;
  fieldTitle?: string;
  optional?: boolean;
}

const SourceField: FC<Props> = ({
  interceptor,
  onChange,
  getContainers,
  getRunners,
  elementId,
  fieldTitle,
  optional,
}) => {
  const [source, setSource] = useState(SOURCE_ITEMS[0].id);

  useEffect(() => {
    setSource(interceptor.source?.$type || SOURCE_ITEMS[0].id);
  }, [interceptor]);

  return (
    <div className="flex flex-col gap-6 mt-3">
      <div className="flex flex-col max-w-fit">
        <Field fieldTitle={fieldTitle} optional={optional} htmlFor={elementId} />
        <DropdownField
          items={SOURCE_ITEMS}
          onChange={(source) => {
            setSource(source as SOURCE_TYPE);
            onChange({ ...interceptor, source: { ...interceptor.source, $type: source as SOURCE_TYPE } });
          }}
          elementId={elementId}
          selectedValue={source}
        />
      </div>

      {source === SOURCE_TYPE.ENDPOINTS && <Endpoints entity={interceptor} onChange={onChange} />}
      {source === SOURCE_TYPE.CONTAINER && (
        <Containers entity={interceptor} onChange={onChange} getContainers={getContainers} fieldId={'containers'} />
      )}
      {source === SOURCE_TYPE.RUNNER && (
        <Templates entity={interceptor} onChange={onChange} getRunners={getRunners} fieldId={'templates'} />
      )}
    </div>
  );
};

export default SourceField;
