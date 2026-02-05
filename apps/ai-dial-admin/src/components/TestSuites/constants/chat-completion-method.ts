export const CHAT_COMPLETION_METHOD = {
  method: 'POST',
  operationId: 'sendChatCompletionRequest',
  summary: '/openai/deployments/{Deployment Name}/chat/completions',
  description:
    'This API is based on the OpenAI Azure API and extended to support working with advanced DIAL agents and applications.',
  parameters: [
    {
      name: 'Deployment Name',
      in: 'path',
      schema: {
        type: 'string',
      },
      description: 'The name of the deployment.',
      required: true,
    },
    {
      in: 'query',
      name: 'api-version',
      schema: {
        type: 'string',
      },
      required: true,
      description: 'The API version to use for this request. Follows the `YYYY-MM-DD[-preview]` format.',
      example: '2024-10-21',
    },
    {
      name: 'X-CACHE-POLICY',
      in: 'header',
      schema: {
        type: 'string',
        enum: ['availability-priority', 'cache-priority'],
        default: 'availability-priority',
        description:
          "The header configures the policy of upstream selection for this particular chat completions request. This policy makes sense only for deployments supporting prompt caching, that is those with `features.cachedSupported` or `features.autoCachingSupported` features enabled in the DIAL Core config.\n\n`availability-priority`: Policy prioritizes upstream availability over a potential cache hit. That is, if an upstream with a cache doesn't respond, then an alternative upstream will be tried.\n\n`cache-priority`: Policy prioritizes cache hits over availability. That is, if an upstream with a cache doesn't respond, then DIAL Core will persist with requests to this same upstream.",
      },
    },
  ],
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            model: {
              type: 'string',
              description: 'The name of the model to use.',
            },
            messages: {
              type: 'array',
              minItems: 1,
              description: 'A list of messages comprising the conversation so far.',
              items: {
                $ref: '#/components/schemas/ChatCompletionRequestMessage',
              },
            },
            functions: {
              deprecated: true,
              description:
                'Deprecated in favor of `tools`.\n\nA list of functions the model may generate JSON inputs for.',
              type: 'array',
              minItems: 1,
              maxItems: 128,
              items: {
                $ref: '#/components/schemas/ChatCompletionFunction',
              },
            },
            function_call: {
              deprecated: true,
              description:
                'Deprecated in favor of `tool_choice`.\n\nControls which (if any) `function` is called by the model.\n\n`none` means the model will not call a `function` and instead generates a `message`.\n\n`auto` means the model can pick between generating a `message` or calling a `function`.\n\nSpecifying a particular function via `{"name": "my_function"}` forces the model to call that function.\n\n`none` is the default when no functions are present. `auto` is the default if functions are present.',
              oneOf: [
                {
                  type: 'string',
                  description:
                    '`none` means the model will not call a function and instead generates a message. `auto` means the model can pick between generating a message or calling a function.',
                  enum: ['none', 'auto'],
                },
                {
                  $ref: '#/components/schemas/ChatCompletionFunctionCallOption',
                },
              ],
            },
            tools: {
              type: 'array',
              description:
                'A list of tools the model may call. Currently, only `functions` are supported as a tool. Use this to provide a list of `functions` the model may generate JSON inputs for. A max of 128 functions are supported.',
              items: {
                $ref: '#/components/schemas/ChatCompletionTool',
              },
            },
            tool_choice: {
              $ref: '#/components/schemas/ChatCompletionToolChoiceOption',
            },
            addons: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ChatCompletionAddon',
              },
              description: 'A list of Addons the Assistant can use.',
              deprecated: true,
            },
            stream: {
              description:
                'If set, partial message deltas will be sent. Tokens will be sent as data-only server-sent events as they become available, with the stream terminated by a `data: [DONE]` message.',
              type: 'boolean',
              nullable: true,
              default: false,
            },
            temperature: {
              type: 'number',
              description:
                'What sampling temperature to use, between 0 and 2. Higher values such as 0.8 make the output more random, while lower values like 0.2 make it more focused and deterministic.',
              minimum: 0,
              maximum: 2,
              default: 1,
            },
            top_p: {
              type: 'number',
              description:
                'An alternative to sampling with temperature, called nucleus sampling, where the Assistant considers the results of the tokens with `top_p` probability mass. A value of 0.1 implies that only the tokens representing the top 10% probability mass are taken into consideration.',
              minimum: 0,
              maximum: 1,
              default: 1,
            },
            n: {
              type: 'integer',
              minimum: 1,
              maximum: 128,
              default: 1,
              example: 1,
              nullable: true,
              description:
                'How many chat completion choices to generate for each input message. Note that you will be charged based on the number of generated tokens across all of the choices. Keep `n` as `1` to minimize costs.',
            },
            parallel_tool_calls: {
              $ref: '#/components/schemas/ParallelToolCalls',
            },
            stop: {
              oneOf: [
                {
                  type: 'string',
                  nullable: true,
                },
                {
                  type: 'array',
                  minItems: 1,
                  maxItems: 4,
                  items: {
                    type: 'string',
                  },
                },
              ],
              description: 'Up to 4 sequences where the Assistant will stop generating further tokens.',
            },
            max_tokens: {
              type: 'integer',
              description: 'The maximum number of tokens to generate by the Assistant.',
              default: null,
            },
            max_prompt_tokens: {
              type: 'integer',
              description:
                'The maximum number of prompt tokens to handle in a request. The feature is supported only by the model adapters and the Assistant. Given this parameter an adapter truncates the list of the messages to fit into this limit and passes the truncated list to the actual model.\n\nThe default strategy for truncation is to preserve all system messages and the last message. Whatever else could fit within the limit is added to the final list of messages, prioritizing the most recent messages in the chat over the earlier ones.\n\nThe list of indices of the messages that were discarded is returned in the `statistics.discarded_messages` field of the response.',
              default: null,
            },
            max_completion_tokens: {
              description:
                'Note the parameter is only supported in OpenAI models.\n\nAn upper bound for the number of tokens that can be generated for a completion, including visible output tokens and reasoning tokens.',
              type: 'integer',
              nullable: true,
            },
            presence_penalty: {
              type: 'number',
              description:
                "A number between `-2.0` and `2.0`. Positive values impose a penalty on new tokens based on their appearance in the current text, thereby increasing the model's tendency to introduce new topics in its responses.",
              minimum: -2,
              maximum: 2,
              default: 0,
            },
            frequency_penalty: {
              type: 'number',
              description:
                "A number between `-2.0` and `2.0`. Positive values apply a penalty to new tokens according to their existing frequency in the preceding text, thereby reducing the model's propensity to repeat the exact same line.",
              minimum: -2,
              maximum: 2,
              default: 0,
            },
            logit_bias: {
              type: 'object',
              additionalProperties: true,
              description:
                'Modifies the likelihood of specified tokens appearing in the completion.\n\nAccepts a JSON object that maps tokens (specified by their token ID in the tokenizer) to an associated bias value from `-100` to `100`. Mathematically, the bias is added to the `logits` generated by the model prior to sampling. The exact effect will vary per model, but values between `-1` and `1` should decrease or increase the likelihood of a selection; values like `-100` or `100` should result in a ban or exclusive selection of the relevant token.',
              default: null,
            },
            seed: {
              type: 'integer',
              minimum: '-9223372036854775808',
              maximum: '9223372036854775807',
              nullable: true,
              description:
                'This feature is in Beta.\n\nIf specified, our system will make a best effort to sample deterministically, such that repeated requests with the same `seed` and parameters should return the same result.\nDeterminism is not guaranteed, and you should refer to the `system_fingerprint` response parameter to monitor changes in the backend.',
            },
            user: {
              type: 'string',
              description: 'A unique identifier representing the end-user.',
            },
            response_format: {
              description:
                'An object specifying the format that the model must output. Compatible with GPT-4o, GPT-4o mini, GPT-4 Turbo and all GPT-3.5 Turbo models newer than `gpt-3.5-turbo-1106`.\n\nSetting to `{ "type": "json_schema", "json_schema": {...} }` enables Structured Outputs which guarantees the model will match your supplied JSON schema.\n\nSetting to `{ "type": "json_object" }` enables JSON mode, which guarantees the message the model generates is valid JSON.\n\nImportant: when using JSON mode, you must also instruct the model to produce JSON yourself via a system or user message. Without this, the model may generate an unending stream of whitespace until the generation reaches the token limit, resulting in a long-running and seemingly "stuck" request. Also note that the message content may be partially cut off if `finish_reason="length"`, which indicates the generation exceeded `max_tokens` or the conversation exceeded the max context length.\n\nNote: JSON mode is not supported by all models.',
              oneOf: [
                {
                  $ref: '#/components/schemas/ResponseFormatText',
                },
                {
                  $ref: '#/components/schemas/ResponseFormatJsonObject',
                },
                {
                  $ref: '#/components/schemas/ResponseFormatJsonSchema',
                },
              ],
            },
            custom_fields: {
              $ref: '#/components/schemas/ChatCompletionsCustomFields',
            },
          },
          required: ['messages'],
        },
        examples: {
          'Chat Model': {
            value: {
              messages: [
                {
                  role: 'user',
                  content: 'Hello!',
                },
              ],
            },
          },
          'Chat Model Streaming': {
            value: {
              stream: true,
              messages: [
                {
                  role: 'user',
                  content: 'Hello!',
                },
              ],
            },
          },
        },
      },
    },
  },
  responses: {
    '200': {
      description: 'Success',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/CreateChatCompletionResponse',
          },
          examples: {
            'Chat Model': {
              value: {
                id: 'chatcmpl-8mt8AF8xkczUdRv250bpmU6KqMfAb',
                choices: [
                  {
                    finish_reason: 'stop',
                    index: 0,
                    message: {
                      role: 'assistant',
                      content:
                        'ChatGPT is an advanced conversational AI model built on the GPT-3.5 architecture. It is a Large Language Model (LLM) that can engage in context-aware, human-like interactions. It is a suitable testbed for creativity and has demonstrated remarkable capabilities in understanding and generating human-like text. It heavily relies on in-context examples and has a strong bias toward using or not using certain tools.',
                      refusal: null,
                    },
                  },
                ],
                created: 1706662358,
                model: 'gpt-4',
                object: 'chat.completion',
                usage: {
                  completion_tokens: 0,
                  prompt_tokens: 9,
                  total_tokens: 18,
                },
              },
            },
          },
        },
        'text/event-stream': {
          schema: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/CreateChatCompletionStreamResponse',
            },
          },
          examples: {
            'Chat Model Streaming': {
              value: [
                {
                  id: 'chatcmpl-8nCUKwNc1iEHEUuOhsU48eODcNWCL',
                  choices: [
                    {
                      delta: {
                        content: '',
                        role: 'assistant',
                      },
                      finish_reason: null,
                      index: 0,
                    },
                  ],
                  created: 1706736768,
                  model: 'gpt-4',
                  object: 'chat.completion.chunk',
                },
                {
                  id: 'chatcmpl-8nCUKwNc1iEHEUuOhsU48eODcNWCL',
                  choices: [
                    {
                      delta: {
                        content: 'Hello',
                      },
                      finish_reason: null,
                      index: 0,
                    },
                  ],
                  created: 1706736768,
                  model: 'gpt-4',
                  object: 'chat.completion.chunk',
                },
                {
                  id: 'chatcmpl-8nCUKwNc1iEHEUuOhsU48eODcNWCL',
                  choices: [
                    {
                      delta: {
                        content: '!',
                      },
                      finish_reason: null,
                      index: 0,
                    },
                  ],
                  created: 1706736768,
                  model: 'gpt-4',
                  object: 'chat.completion.chunk',
                },
                {
                  id: 'chatcmpl-8nCUKwNc1iEHEUuOhsU48eODcNWCL',
                  choices: [
                    {
                      delta: {
                        content: ' How',
                      },
                      finish_reason: null,
                      index: 0,
                    },
                  ],
                  created: 1706736768,
                  model: 'gpt-4',
                  object: 'chat.completion.chunk',
                },
                {
                  id: 'chatcmpl-8nCUKwNc1iEHEUuOhsU48eODcNWCL',
                  choices: [
                    {
                      delta: {
                        content: ' can',
                      },
                      finish_reason: null,
                      index: 0,
                    },
                  ],
                  created: 1706736768,
                  model: 'gpt-4',
                  object: 'chat.completion.chunk',
                },
                {
                  id: 'chatcmpl-8nCUKwNc1iEHEUuOhsU48eODcNWCL',
                  choices: [
                    {
                      delta: {
                        content: ' I',
                      },
                      finish_reason: null,
                      index: 0,
                    },
                  ],
                  created: 1706736768,
                  model: 'gpt-4',
                  object: 'chat.completion.chunk',
                },
                {
                  id: 'chatcmpl-8nCUKwNc1iEHEUuOhsU48eODcNWCL',
                  choices: [
                    {
                      delta: {
                        content: ' assist',
                      },
                      finish_reason: null,
                      index: 0,
                    },
                  ],
                  created: 1706736768,
                  model: 'gpt-4',
                  object: 'chat.completion.chunk',
                },
                {
                  id: 'chatcmpl-8nCUKwNc1iEHEUuOhsU48eODcNWCL',
                  choices: [
                    {
                      delta: {
                        content: ' you',
                      },
                      finish_reason: null,
                      index: 0,
                    },
                  ],
                  created: 1706736768,
                  model: 'gpt-4',
                  object: 'chat.completion.chunk',
                },
                {
                  id: 'chatcmpl-8nCUKwNc1iEHEUuOhsU48eODcNWCL',
                  choices: [
                    {
                      delta: {
                        content: ' today',
                      },
                      finish_reason: null,
                      index: 0,
                    },
                  ],
                  created: 1706736768,
                  model: 'gpt-4',
                  object: 'chat.completion.chunk',
                },
                {
                  id: 'chatcmpl-8nCUKwNc1iEHEUuOhsU48eODcNWCL',
                  choices: [
                    {
                      delta: {
                        content: '?',
                      },
                      finish_reason: null,
                      index: 0,
                    },
                  ],
                  created: 1706736768,
                  model: 'gpt-4',
                  object: 'chat.completion.chunk',
                },
                {
                  id: 'chatcmpl-8nCUKwNc1iEHEUuOhsU48eODcNWCL',
                  choices: [
                    {
                      delta: {
                        content: '',
                      },
                      finish_reason: 'stop',
                      index: 0,
                    },
                  ],
                  created: 1706736768,
                  model: 'gpt-4',
                  object: 'chat.completion.chunk',
                  usage: {
                    completion_tokens: 9,
                    prompt_tokens: 9,
                    total_tokens: 18,
                  },
                },
              ],
            },
          },
        },
      },
    },
    '401': {
      description: 'Invalid Authentication',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    '404': {
      description:
        "Not found\n\nReturned either when:\n1. The deployment called `{Deployment Name}` doesn't exist. Check the DIAL listing to verify that the deployment does actually exist.\n2. The `api-version` query parameter points to an API version that doesn't exist. This is relevant only for deployments based on Azure OpenAI models.",
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    '429': {
      description: 'Rate limit reached.',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    '500': {
      description: 'The server had an error while processing your request.',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    '503': {
      description: 'The engine is currently overloaded, please try again later.',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  },
  'x-codeSamples': [
    {
      lang: 'cURL',
      label: 'CURL',
      source:
        'curl https://chat.<company>.com/openai/deployments/gpt-4/chat/completions?api-version=2023-12-01-preview \\\n  -H "Content-Type: application/json" \\\n  -H "Api-Key: DIAL_API_KEY" \\\n  -d \'{\n    "messages": [{"role": "user", "content": "Hello!"}]\n  }\'',
    },
    {
      lang: 'Python',
      label: 'Python (LangChain 0.1.4)',
      source:
        'from langchain_openai import AzureChatOpenAI\nfrom langchain.schema import HumanMessage\n\nmodel = AzureChatOpenAI(\n    openai_api_version="2023-12-01-preview",\n    azure_deployment="gpt-4",\n    azure_endpoint="https://chat.<company>.com",\n    api_key="DIAL_API_KEY"\n)\n\nresponse = model.invoke(\n    [\n        HumanMessage(\n            content="Hello!"\n        )\n    ]\n)',
    },
    {
      lang: 'Python',
      label: 'Python (OpenAI Library 1.10)',
      source:
        'from openai import AzureOpenAI\n\nclient = AzureOpenAI(\n    api_version="2023-12-01-preview",\n    azure_endpoint="https://chat.<company>.com",\n    api_key="DIAL_API_KEY"\n)\n\nresponse = client.chat.completions.create(\n    model="gpt-4",\n    messages=[\n        {\n            "role": "user",\n            "content": "Hello!",\n        }\n    ]\n)',
    },
  ],
};
