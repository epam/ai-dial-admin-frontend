'use client';

import { FC } from 'react';

import Icon from '@/public/images/403.svg';

const Page403: FC = () => {
  return (
    <div className="size-full flex flex-col items-center justify-center bg-layer-2">
      <div>
        <Icon />
      </div>
      <div className="text-2xl mt-6 mb-2">Access Forbidden</div>
      <div className="flex flex-col text-center text-secondary">
        <h2>Access to this resource is denied.</h2>
        <h2>Refer to system administrator.</h2>
      </div>
    </div>
  );
};

export default Page403;
