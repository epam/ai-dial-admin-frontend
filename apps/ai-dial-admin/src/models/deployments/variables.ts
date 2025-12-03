import { MOUNT_TYPE, VALUE_TYPE } from '@/src/types/deployments/variables';

export interface EnvironmentVariable {
  name: string;
  description: string;
  value: EnvVariableValue;
  mountType: MOUNT_TYPE;
}

export interface EnvVariableValue {
  $type: VALUE_TYPE;
  fileContent?: string;
  fileName?: string;
  value?: string;
}
