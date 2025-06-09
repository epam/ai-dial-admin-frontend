import { TextDecoder, TextEncoder } from 'util';

require('jest-fetch-mock').enableMocks();

global.ReadableStream = jest.fn(() => ({
  getReader: jest.fn(() => ({
    read: jest.fn(() => Promise.resolve({ done: true, value: null })),
  })),
}));
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

class ResizeObserver {
  observe() {
  }

  unobserve() {
  }

  disconnect() {
  }
}

global.ResizeObserver = ResizeObserver;

HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(),
  putImageData: jest.fn(),
  createImageData: jest.fn(),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}));

jest.mock('@/src/locales/client', () => ({
  useI18n: jest.fn(() => jest.fn((key) => key)),
  useCurrentLocale: () => 'en',
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(),
  cookies: jest.fn(),
}));

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

jest.mock('jose', () => ({
  decodeJwt: jest.fn(),
}));
