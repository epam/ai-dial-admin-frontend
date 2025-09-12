import { ApplicationRoute } from '@/src/types/routes';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialPrompt } from '@/src/models/dial/prompt';

export const prepareEntityForDuplicate = (route: ApplicationRoute, entity: BaseEntity, prompt?: DialPrompt | null) => {
  if (route === ApplicationRoute.Roles) {
    return {
      name: entity.name,
      description: entity.description,
    };
  }

  if (route === ApplicationRoute.Interceptors) {
    return {
      ...entity,
      entities: [],
    };
  }

  if (route === ApplicationRoute.Keys) {
    return {
      ...entity,
      roles: [],
    };
  }

  if (route === ApplicationRoute.Prompts) {
    return {
      ...entity,
      description: prompt?.description,
      content: prompt?.content,
    };
  }

  return entity;
};
