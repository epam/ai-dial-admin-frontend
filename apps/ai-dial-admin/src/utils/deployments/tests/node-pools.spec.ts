import { describe, expect, test } from 'vitest';

import { NodePool } from '@/src/models/deployments/node-pools';

import { humanBytes, humanMilliCpus, isGpuPool, totalVramBytes } from '../node-pools';

const GiB = 1024 ** 3;

const makeGpuPool = (): NodePool => ({
  name: 'gpu-a100',
  cpu: { milliCpus: 32000, name: 'Intel Xeon' },
  memory: { bytes: 256 * GiB },
  gpu: { name: 'NVIDIA A100', count: 4, vramBytes: 80 * GiB },
  minNodes: 0,
  maxNodes: 4,
});

const makeCpuPool = (): NodePool => ({
  name: 'cpu-std',
  cpu: { milliCpus: 500 },
  memory: { bytes: 1024 },
  minNodes: 1,
  maxNodes: 2,
});

describe('humanBytes', () => {
  test('returns 0 B for non-positive input', () => {
    expect(humanBytes(0)).toBe('0 B');
    expect(humanBytes(-10)).toBe('0 B');
    expect(humanBytes(Number.NaN)).toBe('0 B');
  });

  test('formats to GiB with one decimal for mid-range values', () => {
    expect(humanBytes(80 * GiB)).toBe('80 GiB');
    expect(humanBytes(1.5 * GiB)).toBe('1.5 GiB');
  });

  test('rounds to whole units for 100+', () => {
    expect(humanBytes(256 * GiB)).toBe('256 GiB');
  });
});

describe('humanMilliCpus', () => {
  test('formats whole cores without decimals', () => {
    expect(humanMilliCpus(32000)).toBe('32 vCPU');
  });

  test('formats fractional cores with one decimal', () => {
    expect(humanMilliCpus(500)).toBe('0.5 vCPU');
  });

  test('returns 0 vCPU for invalid input', () => {
    expect(humanMilliCpus(0)).toBe('0 vCPU');
    expect(humanMilliCpus(-1)).toBe('0 vCPU');
  });
});

describe('totalVramBytes', () => {
  test('multiplies per-gpu vram by count for GPU pools', () => {
    expect(totalVramBytes(makeGpuPool())).toBe(4 * 80 * GiB);
  });

  test('returns 0 for CPU pools', () => {
    expect(totalVramBytes(makeCpuPool())).toBe(0);
  });
});

describe('isGpuPool', () => {
  test('true when gpu is defined', () => {
    expect(isGpuPool(makeGpuPool())).toBe(true);
  });

  test('false when gpu is missing', () => {
    expect(isGpuPool(makeCpuPool())).toBe(false);
  });
});
