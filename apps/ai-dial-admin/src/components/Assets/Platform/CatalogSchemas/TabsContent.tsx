'use client';

import { FC } from 'react';

import { EntityViewTab } from '@/src/utils/tabs/utils';
import CatalogSchemaParameters from './Parameters';
import CatalogSchemaProperties from './Properties';
import { CatalogSchemaTabsProps } from './models';

const TabsContent: FC<CatalogSchemaTabsProps> = ({ activeTab, schema, isSkipRefresh, onChange }) => {
  return (
    <>
      {activeTab === EntityViewTab.Properties && <CatalogSchemaProperties schema={schema} onChange={onChange} />}

      {activeTab === EntityViewTab.Parameters && (
        <CatalogSchemaParameters schema={schema} onChange={onChange} isSkipRefresh={isSkipRefresh} />
      )}
    </>
  );
};

export default TabsContent;
