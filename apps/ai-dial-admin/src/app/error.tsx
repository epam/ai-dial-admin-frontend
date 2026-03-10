'use client';

import Link from 'next/link';
import { FC, useEffect } from 'react';

import { ApplicationRoute } from '@/src/types/routes';
import { ButtonAppearance, DialPrimaryButton } from '@epam/ai-dial-ui-kit';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}
const GlobalError: FC<Props> = ({ error, reset }) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="size-full flex flex-col items-center justify-center bg-layer-2">
          <div className="text-2xl mt-6 mb-2">Something went wrong</div>

          <div className="flex flex-col text-center text-secondary justify-center">
            <h2>An unexpected error occurred while loading the page.</h2>
            {error.digest && <h2>Error ID: {error.digest}</h2>}
            <div className="flex flex-row items-center justify-center mt-4">
              <div>
                <DialPrimaryButton label="Try again" appearance={ButtonAppearance.Ghost} onClick={reset} />
              </div>
              <Link className="text-accent-primary ml-2" aria-label="homepage" href={ApplicationRoute.Home}>
                Homepage
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};

export default GlobalError;
