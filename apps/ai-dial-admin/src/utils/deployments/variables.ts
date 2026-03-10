import { MOUNT_TYPE } from '@/src/types/deployments/variables';
import { Container } from '@/src/models/deployments/containers';
import { EnvironmentVariable } from '@/src/models/deployments/variables';

export const toBase64Value = (value: string) => {
  return Buffer.from(value, 'utf-8').toString('base64');
};

export const fromBase64Value = (value: string) => {
  return Buffer.from(value, 'base64').toString('utf-8');
};

export const encodeVariables = (container: Container) => {
  if (container.metadata?.envs?.length) {
    container.metadata.envs.map((variable: EnvironmentVariable) => {
      if (variable.mountType === MOUNT_TYPE.SECURE_FILE && variable.value.value) {
        variable.value = {
          ...variable.value,
          value: toBase64Value(variable.value.value),
        };
      }
    });
  }

  return container;
};

export const decodeVariables = (container: Container) => {
  if (container.metadata?.envs?.length) {
    container.metadata.envs.map((variable: EnvironmentVariable) => {
      if (variable.mountType === MOUNT_TYPE.SECURE_FILE && variable.value.value) {
        variable.value = {
          ...variable.value,
          value: fromBase64Value(variable.value.value),
        };
      }
    });
  }

  return container;
};
