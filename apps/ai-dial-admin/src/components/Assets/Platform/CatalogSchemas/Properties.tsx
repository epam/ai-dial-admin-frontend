'use client';

import { FC } from 'react';

import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import { DialCatalogSchemaResource } from '@/src/models/dial/resource';
import CatalogSchemaCreateProperties from './CreateProperties';
import { CatalogSchemaProps } from './models';

const CatalogSchemaProperties: FC<CatalogSchemaProps> = ({ schema, onChange }) => {
  return (
    <div className="flex flex-col">
      <ResourceInfoHeader entity={schema} />
      <div className="mt-8">
        <CatalogSchemaCreateProperties
          entity={schema}
          names={[]}
          isModal={false}
          onChangeEntity={(entity) => onChange(entity as DialCatalogSchemaResource)}
        />
      </div>
    </div>
  );
};

export default CatalogSchemaProperties;
