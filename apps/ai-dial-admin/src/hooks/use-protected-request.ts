'use client';

import { ServerActionResponse } from '@/src/models/server-action';
import { isClientSessionValid } from '@/src/utils/auth/session';
import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuthConfig } from './use-auth';

interface ProtectedRequestOptions {
  maxRetries?: number;
  retryDelay?: number;
}
const UNAUTHORIZED_ERROR = 401;

export const useProtectedRequest = (options?: ProtectedRequestOptions) => {
  const { update: updateSession } = useAuthConfig();
  const router = useRouter();

  return async (actionFn: ((...r: any[]) => Promise<ServerActionResponse>) | undefined, ...args: any[]) => {
    const { maxRetries = 0, retryDelay = 1000 } = options ?? {};

    const ensureSessionValidity = async (session: Session | null) => {
      if (!isClientSessionValid(session)) {
        console.error('Session is not valid, signing out');
        await signOut({ redirect: false });
        await updateSession();
        router.push('/');
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    };

    const executeWithRetry = async (retryCount = 0): Promise<ServerActionResponse> => {
      try {
        const response = await actionFn?.(...args);

        if (response?.success) {
          return response;
        }

        if (response?.status === UNAUTHORIZED_ERROR) {
          console.error('Session expired, trying to refresh');

          const session = await updateSession();
          const isRedirected = await ensureSessionValidity(session);
          if (isRedirected) {
            return response;
          }

          const secondResponse = await actionFn?.(...args);
          if (secondResponse?.success || secondResponse?.status !== UNAUTHORIZED_ERROR) {
            if (!secondResponse?.success && secondResponse?.status) {
              console.error(`Received response with status code ${secondResponse.status}`);
            }
            return (
              secondResponse || {
                success: false,
                status: 500,
                errorMessage: 'No response received after session refresh',
              }
            );
          }

          console.error('Received 401 after session refresh');
          await ensureSessionValidity(session);
          return secondResponse;
        }

        if (!response?.success && retryCount < maxRetries) {
          console.error(
            `Request failed with status code ${response?.status}, retrying (${retryCount + 1}/${maxRetries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return executeWithRetry(retryCount + 1);
        }

        if (!response?.status) {
          console.error(`Received final response with status code ${response?.status}`);
        }
        return (
          response || {
            success: false,
            status: 500,
            errorMessage: 'No response received from the server',
          }
        );
      } catch (error) {
        console.error(`Error executing request: ${error}`);

        if (retryCount < maxRetries) {
          console.error(`Retrying after error (${retryCount + 1}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return executeWithRetry(retryCount + 1);
        }

        return {
          success: false,
          statusCode: 500,
          errorMessage: `Request failed after ${maxRetries} retries: ${error}`,
        } as ServerActionResponse;
      }
    };

    return executeWithRetry();
  };
};
