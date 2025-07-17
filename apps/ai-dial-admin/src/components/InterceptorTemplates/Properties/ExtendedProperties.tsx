import { FC } from 'react';

import { InterceptorTemplate } from '@/src/models/interceptor-template';

import BaseProperties from '@/src/components/InterceptorTemplates/Properties/BaseProperties';
import SourceField from '@/src/components/SourceField/SourceField';

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
      <SourceField template={template} onChange={onChange} />
    </div>
  );
};

export default ExtendedProperties;
