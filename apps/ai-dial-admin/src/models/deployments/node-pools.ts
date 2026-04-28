export interface NodePoolGpu {
  name: string;
  count: number;
  vramBytes: number;
}

export interface NodePoolCpu {
  milliCpus: number;
  name?: string;
}

export interface NodePoolMemory {
  bytes: number;
}

export interface NodePool {
  name: string;
  description?: string;
  gpu?: NodePoolGpu;
  cpu: NodePoolCpu;
  memory: NodePoolMemory;
  minNodes: number;
  maxNodes: number;
  instance?: string;
}
