import { Token } from '@/src/models/auth';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { ServerActionResponse } from '@/src/models/server-action';
import { API } from '../api';
import { BaseApi } from '../base-api';

export const INTERCEPTOR_TEMPLATES_URL = `${API}/interceptor-runners`;
export const INTERCEPTOR_TEMPLATE_URL = (name?: string) => `${INTERCEPTOR_TEMPLATES_URL}/${name || ''}`;
export const DELETE_INTERCEPTOR_TEMPLATE_URL = (name?: string) =>
  `${INTERCEPTOR_TEMPLATE_URL(name)}?removeInterceptor=true`;

export class InterceptorTemplatesApi extends BaseApi {
  getInterceptorTemplatesList(token: Token): Promise<InterceptorTemplate[] | null> {
    return this.get(INTERCEPTOR_TEMPLATES_URL, token);
  }

  getInterceptorTemplatesListAction(token: Token): Promise<ServerActionResponse<InterceptorTemplate[]>> {
    return this.getAction(INTERCEPTOR_TEMPLATES_URL, token);
  }

  getInterceptorTemplate(name: string, token: Token, eTag: string) {
    return this.getActionWithEtag(INTERCEPTOR_TEMPLATE_URL(name), eTag, token);
  }

  createInterceptorTemplate(template: InterceptorTemplate, token: Token): Promise<ServerActionResponse> {
    return this.postAction(INTERCEPTOR_TEMPLATES_URL, template, token);
  }

  deleteInterceptorTemplate(token: Token, name?: string): Promise<ServerActionResponse> {
    return this.deleteAction(DELETE_INTERCEPTOR_TEMPLATE_URL(name), token);
  }

  updateInterceptorTemplate(template: InterceptorTemplate, token: Token, eTag: string): Promise<ServerActionResponse> {
    return this.putActionWithEtag(
      INTERCEPTOR_TEMPLATE_URL(encodeURIComponent(template.name || '')),
      template,
      token,
      eTag,
    );
  }
}
