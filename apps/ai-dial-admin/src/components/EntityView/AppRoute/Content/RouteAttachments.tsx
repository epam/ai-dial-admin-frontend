'use client';
import { FC, useState } from 'react';

import Tabs from '@/src/components/Common/Tabs/Tabs';
import { attachmentsTabs, EntityViewTab, propertiesTabs } from '@/src/components/EntityView/View/utils';
import { useI18n } from '@/src/locales/client';
import { DialRoute } from '@/src/models/dial/route';
import RouteProperties from '@/src/components/Routes/Properties/RouteProperties';

interface Props {
  route: DialRoute;
  onChangeRoute: (route: DialRoute) => void;
}

const RouteAttachments: FC<Props> = ({ route, onChangeRoute }) => {
  const t = useI18n() as (stringToTranslate: string) => string;

  return <div className="h-full w-full p-4 border flex flex-col border-primary rounded">fffff</div>;
};

export default RouteAttachments;
