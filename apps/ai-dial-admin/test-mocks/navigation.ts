import { vi } from 'vitest';
import type * as NavigationModule from 'next/navigation';

type Router = ReturnType<typeof NavigationModule.useRouter>;

const router = {
  back: vi.fn<Router['back']>(),
  forward: vi.fn<Router['forward']>(),
  refresh: vi.fn<Router['refresh']>(),
  push: vi.fn<Router['push']>(),
  replace: vi.fn<Router['replace']>(),
  prefetch: vi.fn<Router['prefetch']>(),
};

let pathname: string | undefined;
let searchParams = new URLSearchParams();

export const navigationModule = {
  useRouter: vi.fn((): Router => router),
  usePathname: vi.fn(() => pathname as string),
  useSearchParams: vi.fn(() => searchParams),
  notFound: vi.fn((): never => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  redirect: vi.fn((url: string): never => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  }),
};

export const navigationMock = {
  router,
  setPathname(value: string) {
    pathname = value;
  },
  setSearchParams(value: string | URLSearchParams) {
    searchParams = new URLSearchParams(value);
  },
  reset() {
    Object.values(router).forEach((fn) => fn.mockReset());
    Object.values(navigationModule).forEach((fn) => fn.mockReset());
    pathname = undefined;
    searchParams = new URLSearchParams();
  },
};
