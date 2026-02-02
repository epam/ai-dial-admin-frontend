import { FC } from 'react';

import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import IdControl from '@/src/components/BaseControls/Id';
import { InterceptorTemplate } from '@/src/models/interceptor-template';

interface Props {
  template: InterceptorTemplate;
  onChangeTemplate: (template: InterceptorTemplate) => void;
  names?: string[];
  isImmutable?: boolean;
}

const BaseProperties: FC<Props> = ({ template, onChangeTemplate, names, isImmutable }) => {
  return (
    <div className="flex flex-col gap-y-8 h-full">
      {!isImmutable && <IdControl entity={template} names={names} onChangeEntity={onChangeTemplate} />}
      <DisplayNameControl
        required={true}
        displayName={template.displayName}
        isFullWidth={!isImmutable}
        onChange={(displayName) => {
          onChangeTemplate({ ...template, displayName });
        }}
      />
      <DescriptionControl entity={template} onChangeEntity={onChangeTemplate} isFullWidth={!isImmutable} />
    </div>
  );
};

export default BaseProperties;
