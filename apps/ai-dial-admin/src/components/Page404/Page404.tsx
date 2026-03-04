'use client';

import Link from 'next/link';
import { FC } from 'react';

import Icon from '@/public/images/404.svg';
import { ApplicationRoute } from '@/src/types/routes';

const Page404: FC = () => {
  return (
    <div className="size-full flex flex-col items-center justify-center bg-layer-2">
      <div>
        <Icon />
      </div>
      <div className="text-2xl mt-6 mb-2">Page not found</div>
      <div className="flex flex-col text-center text-secondary">
        <h2>Resource not found or no longer available.</h2>
        <h2>
          Please check the URL or go back to the
          <Link className="text-accent-primary ml-2" aria-label="homepage" href={ApplicationRoute.Home}>
            Homepage
          </Link>
        </h2>
      </div>
    </div>
  );
};

export default Page404;
