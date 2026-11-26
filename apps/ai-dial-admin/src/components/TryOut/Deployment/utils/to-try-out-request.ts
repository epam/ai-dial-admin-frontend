import { DeploymentTryOutRequest } from '@/src/components/TryOut/Deployment/models';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';
import { TestSuiteRequestTemplateParam } from '@/src/models/evaluation/test-suite';

export type ParsedBody = { isValid: true; value: unknown } | { isValid: false };

/** An empty body is valid and means "send no body". */
export const parseBodyText = (text: string): ParsedBody => {
  if (text.trim() === '') {
    return { isValid: true, value: undefined };
  }
  try {
    return { isValid: true, value: JSON.parse(text) };
  } catch {
    return { isValid: false };
  }
};

/** Rows with a blank name are dropped; a later row overrides an earlier one of the same name. */
export const paramsToRecord = (params?: TestSuiteRequestTemplateParam[]): Record<string, string> =>
  Object.fromEntries(
    (params ?? []).filter(({ key }) => key.trim() !== '').map(({ key, value }) => [key.trim(), value]),
  );

interface Draft {
  type: DeploymentInterfaceType;
  deployment: string;
  headers?: TestSuiteRequestTemplateParam[];
  queryParams?: TestSuiteRequestTemplateParam[];
  bodyText: string;
}

/** The request to send, or `null` while the body is not valid JSON. */
export const toTryOutRequest = ({
  type,
  deployment,
  headers,
  queryParams,
  bodyText,
}: Draft): DeploymentTryOutRequest | null => {
  const body = parseBodyText(bodyText);

  return body.isValid
    ? {
        interface: type,
        deployment,
        headers: paramsToRecord(headers),
        query: paramsToRecord(queryParams),
        body: body.value,
      }
    : null;
};
