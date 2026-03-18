export interface McpRepository {
  url: string;
  source: string;
  id?: string;
  subfolder?: string;
}

export interface McpRemote {
  type: string;
  url: string;
  headers?: { name: string; value?: string }[];
  variables?: Record<string, unknown>;
}

export interface McpPackage {
  registryType: string;
  identifier: string;
  version?: string;
  transport?: { type: string };
  runtimeHint?: string;
  environmentVariables?: {
    name: string;
    value?: string;
    description?: string;
    isRequired?: boolean;
    isSecret?: boolean;
    placeholder?: string;
  }[];
}

export interface McpServer {
  name: string;
  description: string;
  title?: string;
  version: string;
  repository?: McpRepository;
  websiteUrl?: string;
  packages?: McpPackage[];
  remotes?: McpRemote[];
  _meta?: Record<string, unknown>;
}

export interface McpServerResponse {
  server: McpServer;
  _meta?: Record<string, unknown>;
}

export interface McpServersResponse {
  servers: McpServerResponse[];
  metadata?: {
    nextCursor?: string;
    count?: number;
  };
}
