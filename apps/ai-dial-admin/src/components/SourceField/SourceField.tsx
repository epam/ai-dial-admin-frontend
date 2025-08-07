import { FC, useState } from 'react';

import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { SOURCE_ITEMS } from '@/src/components/SourceField/constants';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import ExternalEndpoint from '@/src/components/SourceField/ExternalEndpoint/ExternalEndpoint';
import InterceptorContainer from '@/src/components/SourceField/InterceptorContainer/InterceptorContainer';

interface Props {
  template: InterceptorTemplate;
  onChange: (template: InterceptorTemplate) => void;
}

const SourceField: FC<Props> = ({ template, onChange }) => {
  const [source, setSource] = useState(SOURCE_ITEMS[0].id);

  return (
    <div className="flex flex-col gap-6 mt-3">
      <div className="max-w-fit">
        <DropdownField
          items={SOURCE_ITEMS}
          onChange={(source) => {
            setSource(source as SOURCE_TYPE);
          }}
          elementId={'sourceType'}
          selectedValue={source}
        />
      </div>

      {source === SOURCE_TYPE.EXTERNAL_ENDPOINT && <ExternalEndpoint template={template} onChange={onChange} />}
      {source === SOURCE_TYPE.INTERCEPTOR_CONTAINER && <InterceptorContainer template={template} onChange={onChange} />}
    </div>
  );
};

export default SourceField;
