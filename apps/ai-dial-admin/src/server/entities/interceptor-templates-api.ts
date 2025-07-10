import { JWT } from 'next-auth/jwt';

import { API } from '../api';
import { BaseApi } from '../base-api';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { ServerActionResponse } from '@/src/models/server-action';

export const INTERCEPTOR_TEMPLATES_URL = `${API}/interceptor-runners`;
export const INTERCEPTOR_TEMPLATE_URL = (name?: string) => `${INTERCEPTOR_TEMPLATES_URL}/${name}`;
export const DELETE_INTERCEPTOR_TEMPLATE_URL = (name?: string) =>
  `${INTERCEPTOR_TEMPLATE_URL(name)}?removeInterceptor=true`;

export class InterceptorTemplatesApi extends BaseApi {
  getInterceptorTemplatesList(token: JWT | null): Promise<InterceptorTemplate[] | null> {
    return this.get(INTERCEPTOR_TEMPLATES_URL, token);
  }

  getInterceptorTemplate(name: string, token: JWT | null): Promise<InterceptorTemplate | null> {
    return this.get(INTERCEPTOR_TEMPLATE_URL(name), token);
  }

  createInterceptorTemplate(template: InterceptorTemplate, token: JWT | null): Promise<ServerActionResponse> {
    return this.postAction(INTERCEPTOR_TEMPLATES_URL, template, token);
  }

  deleteInterceptorTemplate(token: JWT | null, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(DELETE_INTERCEPTOR_TEMPLATE_URL(name), token);
  }

  updateInterceptorTemplate(template: InterceptorTemplate, token: JWT | null): Promise<ServerActionResponse> {
    return this.putAction(INTERCEPTOR_TEMPLATE_URL(template.name), template, token);
  }
}
