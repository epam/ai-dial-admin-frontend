import { FC } from 'react';

import DescriptionControl from '@/src/components/EntityMainProperties/BaseProperties/Description';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import IdControl from '@/src/components/EntityMainProperties/BaseProperties/Id';
import { InterceptorTemplate } from '@/src/models/interceptor-template';

interface Props {
  template: InterceptorTemplate;
  setTemplate: (template: InterceptorTemplate) => void;
  names?: string[];
  isImmutable?: boolean;
}

const BaseProperties: FC<Props> = ({ template, setTemplate, names, isImmutable }) => {
  return (
    <div className="flex flex-col gap-6 h-full">
      {!isImmutable && <IdControl entity={template} names={names} onChangeEntity={setTemplate} />}
      <DisplayNameControl
        displayName={template.displayName}
        onChange={(displayName) => {
          setTemplate({ ...template, displayName });
        }}
      />
      <DescriptionControl entity={template} onChangeEntity={setTemplate} />
    </div>
  );
};

export default BaseProperties;
