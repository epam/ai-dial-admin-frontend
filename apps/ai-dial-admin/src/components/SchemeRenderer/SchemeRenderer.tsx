'use client';

import { FC } from 'react';

import { DialScheme } from '@/src/models/dial/scheme';
import { simpleControlTypes } from './constants';
import SimpleTypeArrayControl from './SimpleTypeArrayControl';
import SimpleTypeControls from './SimpleTypeControls';
import { SchemeParameterType } from './types';
import { generateControlsFromScheme } from './utils';

interface Props {
  scheme: DialScheme;
}

const SchemeRenderer: FC<Props> = ({ scheme }) => {
  const controls = generateControlsFromScheme(scheme);

  return controls.map((control) => {
    if (control.type && simpleControlTypes.includes(control.type)) {
      return <SimpleTypeControls key={control.id} control={control} />;
    }

    if (control.type === SchemeParameterType.array && control.itemsTypes?.length === 1) {
      const type = control.itemsTypes[0];
      return <SimpleTypeArrayControl key={control.id} control={control} type={type} />;
    }
    if (control.types?.length) {
      if (control.types.every((t) => t.type === SchemeParameterType.string)) {
        const type = SchemeParameterType.string;
        return <SimpleTypeArrayControl key={control.id} control={control} type={type} />;
      }
    }
    return <div key={control.id}>{control.label} </div>;
  });
};

export default SchemeRenderer;
