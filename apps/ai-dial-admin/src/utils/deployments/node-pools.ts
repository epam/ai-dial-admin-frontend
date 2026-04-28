import { NodePool } from '@/src/models/deployments/node-pools';

const BYTE_UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];

export const humanBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${BYTE_UNITS[exponent]}`;
};

export const humanMilliCpus = (milliCpus: number): string => {
  if (!Number.isFinite(milliCpus) || milliCpus <= 0) return '0 vCPU';
  if (milliCpus % 1000 === 0) return `${milliCpus / 1000} vCPU`;
  return `${(milliCpus / 1000).toFixed(1)} vCPU`;
};

export const totalVramBytes = (pool: NodePool): number => {
  if (!pool.gpu) return 0;
  return pool.gpu.count * pool.gpu.vramBytes;
};

export const isGpuPool = (pool: NodePool): boolean => !!pool.gpu;
