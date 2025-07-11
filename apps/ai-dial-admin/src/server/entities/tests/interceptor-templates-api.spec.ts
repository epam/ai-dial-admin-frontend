import { beforeEach, describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

import { InterceptorTemplate } from '../../../models/interceptor-template';
import { TEST_URL, TOKEN_MOCK } from '../../../utils/tests/mock/api.mock';
import {
  DELETE_INTERCEPTOR_TEMPLATE_URL,
  INTERCEPTOR_TEMPLATE_URL,
  INTERCEPTOR_TEMPLATES_URL,
  InterceptorTemplatesApi,
} from '../interceptor-templates-api';

const fetch = createFetchMock(vi);
fetch.enableMocks();

describe('Server :: InterceptorTemplatesApi', () => {
  const instance = new InterceptorTemplatesApi({ host: TEST_URL });

  const mockTemplate: InterceptorTemplate = {
    name: 'template-1',
    displayName: 'template name',
    description: 'template description',
    completionEndpoint: 'completionEndpoint',
    configurationEndpoint: 'configurationEndpoint'
  };

  beforeEach(() => {
    fetch.resetMocks();
  });

  test('Should fetch interceptor templates list', async () => {
    fetch.mockResponseOnce(JSON.stringify([mockTemplate]));

    const result = await instance.getInterceptorTemplatesList(TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${INTERCEPTOR_TEMPLATES_URL}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(JSON.stringify([mockTemplate]));
  });

  test('Should fetch interceptor template', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockTemplate));

    const result = await instance.getInterceptorTemplate(mockTemplate.name, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${INTERCEPTOR_TEMPLATES_URL}/${mockTemplate.name}`,
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result).toEqual(JSON.stringify(mockTemplate));
  });

  test('Should create interceptor template', async () => {
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    const result = await instance.createInterceptorTemplate(mockTemplate, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${INTERCEPTOR_TEMPLATES_URL}`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockTemplate),
      }),
    );
  });

  test('Should update interceptor template', async () => {
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    const result = await instance.updateInterceptorTemplate(mockTemplate, TOKEN_MOCK);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${INTERCEPTOR_TEMPLATE_URL(mockTemplate.name)}`,
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(mockTemplate),
      }),
    );
  });

  test('Should delete interceptor template', async () => {
    fetch.mockResponseOnce(JSON.stringify({ success: true }));

    const result = await instance.deleteInterceptorTemplate(TOKEN_MOCK, mockTemplate.name);

    expect(fetch).toHaveBeenCalledWith(
      `${TEST_URL}${DELETE_INTERCEPTOR_TEMPLATE_URL(mockTemplate.name)}`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

});
