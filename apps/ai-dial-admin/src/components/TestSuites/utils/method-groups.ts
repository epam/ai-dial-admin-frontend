import { CHAT_COMPLETION_METHOD } from '@/src/components/TestSuites/constants/chat-completion-method';
import {
  CHAT_COMPLETION_RELATIVE_URL,
  CHAT_COMPLETION_SUITE,
  DEFAULT_SUITE,
  RESPONSES_SUITE,
  RESPONSE_ITEM_SUITE,
} from '@/src/components/TestSuites/constants/methods';
import {
  CANCEL_RESPONSE_METHOD,
  CREATE_RESPONSE_METHOD,
  DELETE_RESPONSE_METHOD,
  GET_RESPONSE_METHOD,
  RESPONSES_RELATIVE_URL,
  RESPONSE_CANCEL_URL_TEMPLATE,
  RESPONSE_ITEM_URL_TEMPLATE,
} from '@/src/components/TestSuites/constants/responses-method';
import { generateMethodPathCombinations } from '@/src/components/TestSuites/utils/method';
import { BuildMethodGroupsParams, MethodGroup, MethodOption } from '@/src/components/TestSuites/utils/models';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { DeploymentInterfaceType } from '@/src/models/dial/interfaces';
import { Deployment } from '@/src/models/evaluation/deployment';
import { TestSuiteEndpointRef } from '@/src/models/evaluation/test-suite';
import { uniquifyResponseColumns } from '@/src/utils/evaluation/request-chain';

const RESPONSES_URL_PATTERNS = new Set([
  CREATE_RESPONSE_METHOD.relativeUrlPattern,
  GET_RESPONSE_METHOD.relativeUrlPattern,
  CANCEL_RESPONSE_METHOD.relativeUrlPattern,
]);

const isResponsesEndpoint = (endpointRef?: TestSuiteEndpointRef): boolean =>
  !!endpointRef?.relativeUrlPattern && RESPONSES_URL_PATTERNS.has(endpointRef.relativeUrlPattern);

/**
 * `features.responses_api` is the signal that actually arrives: DIAL Core omits `interfaces` for
 * models fetched through its `/openai/...` API, so a Responses-capable model reports its support
 * only through that flag. `interfaces` is still honoured because it is the documented field and is
 * authoritative wherever Core does populate it.
 *
 * An absent signal means "not reported" rather than "supports nothing", so the group is also kept
 * for a suite already configured against a Responses method — otherwise reopening such a suite
 * would leave its selected method unreachable.
 */
const shouldOfferResponses = (deployment?: Deployment | null, endpointRef?: TestSuiteEndpointRef): boolean =>
  deployment?.features?.responses_api === true ||
  !!deployment?.interfaces?.includes(DeploymentInterfaceType.OpenAIResponses) ||
  isResponsesEndpoint(endpointRef);

const buildChatInterfaceGroup = (takenColumnNames: string[]): MethodGroup => ({
  titleKey: TestSuitesI18nKey.ChatInterface,
  options: [
    {
      ref: CHAT_COMPLETION_METHOD,
      displayUrl: CHAT_COMPLETION_RELATIVE_URL,
      seed: {
        ...CHAT_COMPLETION_SUITE,
        responseColumns: uniquifyResponseColumns(CHAT_COMPLETION_SUITE.responseColumns, takenColumnNames),
      },
    },
  ],
});

const buildResponsesGroup = (deploymentId: string, takenColumnNames: string[]): MethodGroup => {
  const createSuite = RESPONSES_SUITE(deploymentId);

  return {
    titleKey: TestSuitesI18nKey.Responses,
    options: [
      {
        ref: CREATE_RESPONSE_METHOD,
        displayUrl: RESPONSES_RELATIVE_URL,
        seed: {
          ...createSuite,
          responseColumns: uniquifyResponseColumns(createSuite.responseColumns, takenColumnNames),
        },
      },
      {
        ref: GET_RESPONSE_METHOD,
        displayUrl: GET_RESPONSE_METHOD.summary,
        seed: RESPONSE_ITEM_SUITE(GET_RESPONSE_METHOD, RESPONSE_ITEM_URL_TEMPLATE),
      },
      {
        ref: DELETE_RESPONSE_METHOD,
        displayUrl: DELETE_RESPONSE_METHOD.summary,
        seed: RESPONSE_ITEM_SUITE(DELETE_RESPONSE_METHOD, RESPONSE_ITEM_URL_TEMPLATE),
      },
      {
        ref: CANCEL_RESPONSE_METHOD,
        displayUrl: CANCEL_RESPONSE_METHOD.summary,
        seed: RESPONSE_ITEM_SUITE(CANCEL_RESPONSE_METHOD, RESPONSE_CANCEL_URL_TEMPLATE),
      },
    ],
  };
};

const buildRoutesGroup = (deployment?: Deployment | null): MethodGroup => ({
  titleKey: TestSuitesI18nKey.Other,
  options: generateMethodPathCombinations(deployment?.routes).map((route) => ({
    ref: route,
    displayUrl: route.relativeUrlPattern ?? '',
    seed: DEFAULT_SUITE(route),
  })),
});

/**
 * Method options offered for a deployment target, grouped for the method sidebar. Groups are
 * returned in display order; a group with no options is still returned so callers decide whether to
 * render its heading.
 */
export const buildMethodGroups = ({
  deployment,
  endpointRef,
  takenColumnNames = [],
}: BuildMethodGroupsParams): MethodGroup[] => {
  const groups: MethodGroup[] = [buildChatInterfaceGroup(takenColumnNames)];

  if (shouldOfferResponses(deployment, endpointRef)) {
    groups.push(buildResponsesGroup(deployment?.deploymentId ?? '', takenColumnNames));
  }

  groups.push(buildRoutesGroup(deployment));

  return groups;
};

/** Flat, index-addressable list of every offered option, in the order the sidebar renders them. */
export const flattenMethodGroups = (groups: MethodGroup[]): MethodOption[] => groups.flatMap((group) => group.options);
