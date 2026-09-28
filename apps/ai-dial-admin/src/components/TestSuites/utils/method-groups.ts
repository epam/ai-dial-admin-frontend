import {
  ANTHROPIC_MESSAGES_RELATIVE_URL,
  CREATE_MESSAGE_METHOD,
} from '@/src/components/TestSuites/constants/anthropic-messages-method';
import { CHAT_COMPLETION_METHOD } from '@/src/components/TestSuites/constants/chat-completion-method';
import {
  ANTHROPIC_MESSAGES_SUITE,
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
import { DeploymentApiInterface } from '@/src/models/dial/interfaces';
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
 * An unreported `interfaces` list means "not reported" rather than "supports nothing", so the group
 * is also kept for a suite already configured against a Responses method — otherwise reopening such
 * a suite would leave its selected method unreachable.
 */
const shouldOfferResponses = (deployment?: Deployment | null, endpointRef?: TestSuiteEndpointRef): boolean =>
  !!deployment?.interfaces?.includes(DeploymentApiInterface.OpenAIResponses) || isResponsesEndpoint(endpointRef);

const buildChatCompletionsGroup = (takenColumnNames: string[]): MethodGroup => ({
  titleKey: TestSuitesI18nKey.OpenAIChatCompletions,
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
    titleKey: TestSuitesI18nKey.OpenAIResponses,
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

const isAnthropicMessagesEndpoint = (endpointRef?: TestSuiteEndpointRef): boolean =>
  endpointRef?.method === CREATE_MESSAGE_METHOD.method &&
  endpointRef?.relativeUrlPattern === CREATE_MESSAGE_METHOD.relativeUrlPattern;

/**
 * Unlike Responses, Anthropic Messages support has no features-flag equivalent — Core reports it
 * only through `interfaces` — so this is a 2-way OR (interfaces + sticky) rather than a 3-way OR.
 */
const shouldOfferAnthropicMessages = (deployment?: Deployment | null, endpointRef?: TestSuiteEndpointRef): boolean =>
  !!deployment?.interfaces?.includes(DeploymentApiInterface.AnthropicMessages) ||
  isAnthropicMessagesEndpoint(endpointRef);

const buildAnthropicMessagesGroup = (deploymentId: string, takenColumnNames: string[]): MethodGroup => {
  const createSuite = ANTHROPIC_MESSAGES_SUITE(deploymentId);

  return {
    titleKey: TestSuitesI18nKey.AnthropicMessages,
    options: [
      {
        ref: CREATE_MESSAGE_METHOD,
        displayUrl: ANTHROPIC_MESSAGES_RELATIVE_URL,
        seed: {
          ...createSuite,
          responseColumns: uniquifyResponseColumns(createSuite.responseColumns, takenColumnNames),
        },
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
  const groups: MethodGroup[] = [buildChatCompletionsGroup(takenColumnNames)];

  if (shouldOfferResponses(deployment, endpointRef)) {
    groups.push(buildResponsesGroup(deployment?.deploymentId ?? '', takenColumnNames));
  }

  if (shouldOfferAnthropicMessages(deployment, endpointRef)) {
    groups.push(buildAnthropicMessagesGroup(deployment?.deploymentId ?? '', takenColumnNames));
  }

  groups.push(buildRoutesGroup(deployment));

  return groups;
};

export const flattenMethodGroups = (groups: MethodGroup[]): MethodOption[] => groups.flatMap((group) => group.options);
