import { FC } from 'react';

import { InterceptorTemplate } from '@/src/models/interceptor-template';

import BaseProperties from '@/src/components/InterceptorTemplates/Properties/BaseProperties';
import ExternalEndpoint from '@/src/components/SourceField/ExternalEndpoint/ExternalEndpoint';

interface Props {
  template: InterceptorTemplate;
  onChange: (template: InterceptorTemplate) => void;
}

const ExtendedProperties: FC<Props> = ({ template, onChange }) => {
  return (
    <div className="flex flex-col gap-6 mt-3">
      <div className="lg:w-[35%]  ">
        <BaseProperties template={template} setTemplate={onChange} isImmutable={true} />
      </div>
      <ExternalEndpoint template={template} onChange={onChange} />
    </div>
  );
};

export default ExtendedProperties;
