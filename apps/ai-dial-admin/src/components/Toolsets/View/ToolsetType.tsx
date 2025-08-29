'use client';

import { FC } from 'react';

import RadioField from '@/src/components/Common/RadioField/RadioField';
import { DialToolset } from '@/src/models/dial/toolset';
import { RadioButtonModel } from '@/src/models/radio-button';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import { ToolsetTransport } from '@/src/types/toolset';

interface Props {
  selectedToolset: DialToolset;
  onChangeToolset: (toolset: DialToolset) => void;
}

const ToolsetType: FC<Props> = ({ selectedToolset, onChangeToolset }) => {
  const transportOptions: RadioButtonModel[] = [
    { id: ToolsetTransport.HTTP, name: ToolsetTransport.HTTP.toUpperCase() },
    { id: ToolsetTransport.SSE, name: ToolsetTransport.SSE.toUpperCase() },
  ];

  return (
    <div className="flex flex-col">
      {!!selectedToolset.allowedTools && (
        <RadioField
          fieldTitle="Transport"
          elementId="transport"
          activeRadioButton={selectedToolset.transport || ToolsetTransport.SSE}
          radioButtons={transportOptions}
          orientation={RadioFieldOrientation.Column}
          onChange={(transport) => onChangeToolset({ ...selectedToolset, transport: transport as ToolsetTransport })}
        />
      )}
    </div>
  );
};

export default ToolsetType;
