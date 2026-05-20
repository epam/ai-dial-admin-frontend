export interface NodePool {
  id: string;
  name: string;
  description?: string;
}

export interface NodePoolsResponse {
  pools: NodePool[];
}
