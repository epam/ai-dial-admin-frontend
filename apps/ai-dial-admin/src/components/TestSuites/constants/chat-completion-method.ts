export const CHAT_COMPLETION_METHOD = {
  method: 'POST',
  operationId: 'sendChatCompletionRequest',
  summary: '/openai/deployments/{Deployment Name}/chat/completions',
  relativeUrlPattern: '/chat/completions',
  description:
    'This API is based on the OpenAI Azure API and extended to support working with advanced DIAL agents and applications.',
  parameters: [
    {
      in: 'query',
      name: 'api-version',
      schema: {
        type: 'string',
      },
      required: true,
      description: 'The API version to use for this request. Follows the `YYYY-MM-DD[-preview]` format.',
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
  requestBodySchema: {
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
          oneOf: [
            {
              type: 'object',
              title: 'Developer message',
              description: 'Developer-provided instructions that the model should follow.',
              properties: {
                content: { oneOf: [{ type: 'string' }] },
                custom_fields: {
                  type: 'object',
                  properties: {
                    cache_breakpoint: {
                      type: 'object',
                      properties: {
                        expire_at: { type: 'string' },
                      },
                    },
                  },
                },
                role: { type: 'string', enum: ['developer'] },
                name: { type: 'string' },
              },
              required: ['content', 'role'],
            },
            {
              type: 'object',
              title: 'System message',
              properties: {
                content: { oneOf: [{ type: 'string' }] },
                custom_fields: { type: 'object' },
                role: { type: 'string', enum: ['system'] },
                name: { type: 'string' },
              },
              required: ['content', 'role'],
            },
            {
              type: 'object',
              title: 'User message',
              properties: {
                content: { oneOf: [{ type: 'string' }] },
                custom_content: {
                  type: 'object',
                  properties: {
                    attachments: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          type: { type: 'string', default: 'text/markdown' },
                          title: { type: 'string' },
                          data: { type: 'string' },
                          url: { type: 'string' },
                          reference_type: { type: 'string' },
                          reference_url: { type: 'string' },
                        },
                      },
                    },
                    form_value: { type: 'object', additionalProperties: true },
                  },
                },
                custom_fields: { type: 'object' },
                role: { type: 'string', enum: ['user'] },
                name: { type: 'string' },
              },
              required: ['content', 'role'],
            },
            {
              type: 'object',
              title: 'Assistant message',
              properties: {
                content: { type: 'string' },
                custom_content: {
                  type: 'object',
                  properties: {
                    state: { type: 'object', additionalProperties: true },
                    attachments: {
                      type: 'array',
                      items: { type: 'object' },
                    },
                    form_schema: { type: 'object', additionalProperties: true },
                  },
                },
                custom_fields: { type: 'object' },
                refusal: { type: 'string' },
                role: { type: 'string', enum: ['assistant'] },
                name: { type: 'string' },
                tool_calls: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      type: { type: 'string', enum: ['function'] },
                      function: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          arguments: { type: 'string' },
                        },
                        required: ['name', 'arguments'],
                      },
                    },
                    required: ['id', 'type', 'function'],
                  },
                },
                function_call: {
                  type: 'object',
                  properties: { arguments: {} },
                },
              },
              required: ['role'],
            },
            {
              type: 'object',
              title: 'Tool message',
              properties: {
                role: { type: 'string', enum: ['tool'] },
                content: { oneOf: [{ type: 'string' }] },
                custom_fields: { type: 'object' },
                tool_call_id: { type: 'string' },
              },
              required: ['role', 'content', 'tool_call_id'],
            },
            {
              type: 'object',
              title: 'Function message',
              properties: {
                role: { type: 'string', enum: ['function'] },
                content: { type: 'string' },
                custom_fields: { type: 'object' },
                name: { type: 'string' },
              },
              required: ['role', 'content', 'name'],
            },
          ],
        },
      },
      functions: {
        description: 'Deprecated in favor of `tools`. A list of functions the model may generate JSON inputs for.',
        type: 'array',
        minItems: 1,
        maxItems: 128,
        items: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            name: { type: 'string' },
            parameters: { type: 'object', additionalProperties: true },
            strict: { type: 'boolean', default: false },
          },
          required: ['name'],
        },
      },
      function_call: {
        description: 'Deprecated in favor of `tool_choice`. Controls which (if any) `function` is called by the model.',
        oneOf: [
          { type: 'string', enum: ['none', 'auto'] },
          { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
        ],
      },
      tools: {
        type: 'array',
        description: 'A list of tools the model may call.',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['function'] },
            function: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                name: { type: 'string' },
                parameters: { type: 'object', additionalProperties: true },
                strict: { type: 'boolean', default: false },
              },
              required: ['name'],
            },
            custom_fields: { type: 'object' },
          },
          required: ['type', 'function'],
        },
      },
      tool_choice: {
        oneOf: [
          { type: 'string', enum: ['none', 'auto', 'required'] },
          {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['function'] },
              function: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
            },
            required: ['type', 'function'],
          },
        ],
      },
      addons: {
        type: 'array',
        items: {
          oneOf: [
            { type: 'object', properties: { name: { type: 'string' } } },
            { type: 'object', properties: { url: { type: 'string' } } },
          ],
        },
        description: 'A list of Addons the Assistant can use.',
      },
      stream: {
        description: 'If set, partial message deltas will be sent.',
        type: 'boolean',
        default: false,
      },
      temperature: { type: 'number', minimum: 0, maximum: 2, default: 1 },
      top_p: { type: 'number', minimum: 0, maximum: 1, default: 1 },
      n: { type: 'integer', minimum: 1, maximum: 128, default: 1 },
      parallel_tool_calls: { type: 'boolean', default: true },
      stop: {
        oneOf: [{ type: 'string' }, { type: 'array', minItems: 1, maxItems: 4, items: { type: 'string' } }],
      },
      max_tokens: { type: 'integer', description: 'The maximum number of tokens to generate by the Assistant.' },
      max_prompt_tokens: {
        type: 'integer',
        description: 'Maximum number of prompt tokens to handle in a request.',
      },
      max_completion_tokens: { type: 'integer' },
      presence_penalty: { type: 'number', minimum: -2, maximum: 2, default: 0 },
      frequency_penalty: { type: 'number', minimum: -2, maximum: 2, default: 0 },
      logit_bias: { type: 'object', additionalProperties: true, default: null },
      seed: { type: 'integer', minimum: -Number.MAX_SAFE_INTEGER, maximum: Number.MAX_SAFE_INTEGER },
      user: { type: 'string' },
      response_format: {
        oneOf: [
          { type: 'object', properties: { type: { type: 'string', enum: ['text'] } }, required: ['type'] },
          {
            type: 'object',
            properties: { type: { type: 'string', enum: ['json_object'] } },
            required: ['type'],
          },
          {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['json_schema'] },
              json_schema: { type: 'object', additionalProperties: true },
            },
            required: ['type', 'json_schema'],
          },
        ],
      },
      custom_fields: { type: 'object', additionalProperties: true },
    },
    required: ['messages'],
  },
  responseBodySchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'The ID of the response.',
      },
      object: {
        type: 'string',
        description: 'Object type. Always is `chat.completion` for non-streaming.',
      },
      created: {
        type: 'integer',
        description: 'The response timestamp. The time in seconds since the epoch.',
      },
      model: {
        type: 'string',
        description: 'The name of the model that generated the response. May not be the same as the deployment name.',
      },
      choices: {
        type: 'array',
        description: 'List of generated messages. Contains _n_ items.',
        items: {
          type: 'object',
          properties: {
            index: {
              type: 'integer',
              description: 'The index of the choice from `0` to `n - 1`.',
            },
            message: {
              type: 'object',
              description: 'The Assistant message.',
              properties: {
                role: {
                  type: 'string',
                  enum: ['assistant'],
                  description: 'The role of the author of the response message.',
                },
                refusal: {
                  type: 'string',
                  description: 'The refusal message generated by the model.',
                },
                content: {
                  type: 'string',
                  description:
                    'The contents of the message. `content` is set for all messages except messages with tool calls, function calls and refusals.',
                },
                custom_content: {
                  type: 'object',
                  description: 'The custom content of a message.',
                  properties: {
                    attachments: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          index: {
                            type: 'integer',
                            description:
                              'In streaming chat completion responses, each attachment includes an `index` field',
                          },
                          type: {
                            type: 'string',
                            default: 'text/markdown',
                            description: 'The content type of the attachment. Should be one of the MIME types.',
                          },
                          title: {
                            type: 'string',
                            description: 'The title of the attachment.',
                          },
                          data: {
                            type: 'string',
                            description: 'Should follow the format described in the MIME standard for `type`.',
                          },
                          url: {
                            type: 'string',
                            description:
                              'The content of `url` should follow the format described in the MIME standard for `type`.',
                          },
                          reference_type: {
                            type: 'string',
                            description: 'The content type of `reference_url`. Should be one of the MIME types.',
                          },
                          reference_url: {
                            type: 'string',
                            description:
                              'If `reference_type` is specified, the content of `reference_url` should follow the format described in the MIME standard for `reference_type`.',
                          },
                        },
                        required: ['index'],
                      },
                      description: 'List of attachments.',
                    },
                    stages: {
                      type: 'array',
                      readOnly: true,
                      items: {
                        type: 'object',
                        properties: {
                          index: {
                            type: 'integer',
                          },
                          name: {
                            type: 'string',
                            description: 'The name of the stage.',
                          },
                          content: {
                            type: 'string',
                            description: 'The contents of the stage.',
                          },
                          attachments: {
                            type: 'array',
                            items: {
                              type: 'object',
                            },
                            description: 'List of attachments to the stage.',
                          },
                          status: {
                            type: 'string',
                            description: 'The execution status of the stage.',
                          },
                        },
                        required: ['index', 'name', 'status'],
                      },
                      description: 'The intermediate stages that the Assistant went through to generate the response.',
                    },
                    state: {
                      type: 'object',
                      additionalProperties: true,
                      description:
                        'The internal state of the Assistant. This field can have an arbitrary set of fields with an arbitrary structure. In case of a streaming, the state is published fully in one chunk.',
                    },
                  },
                },
                tool_calls: {
                  type: 'array',
                  description: 'The tool calls generated by the model, such as function calls.',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        description: 'The ID of the `tool` call.',
                      },
                      type: {
                        type: 'string',
                        enum: ['function'],
                        description: 'The type of the `tool` call, in this case `function`.',
                      },
                      function: {
                        type: 'object',
                        description: 'The `function` that the model called.',
                        properties: {
                          name: {
                            type: 'string',
                            description: 'The name of the `function` to call.',
                          },
                          arguments: {
                            type: 'string',
                            description:
                              'The arguments to call the `function` with, as generated by the model in JSON format.',
                          },
                        },
                        required: ['name', 'arguments'],
                      },
                    },
                    required: ['id', 'type', 'function'],
                  },
                },
                function_call: {
                  type: 'object',
                  description:
                    'Deprecated and replaced by `tool_calls`. The name and arguments of a `function` that should be called, as generated by the model.',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'The name of the `function` to call.',
                    },
                    arguments: {
                      type: 'string',
                      description:
                        'The arguments to call the `function` with, as generated by the model in JSON format.',
                    },
                  },
                  required: ['name', 'arguments'],
                },
              },
              required: ['role', 'content', 'refusal'],
            },
            finish_reason: {
              type: 'string',
              description:
                'The reason indicating the completion of the choice generation process. The possible reasons:\n\n* `stop`: Successful generation.\n* `length`: The generation was stopped because it surpassed the available number of tokens.\n* `function_call`: The Assistant decided to call a function.\n* `tool_calls`: The Assistant decided to call a tool.\n* `content_filter`: Omitted content due to a flag from content filters.',
            },
          },
          required: ['index', 'message', 'finish_reason'],
        },
      },
      usage: {
        type: 'object',
        description:
          'This field contains information about the tokens from the model that were used to generate the response.',
        properties: {
          prompt_tokens: {
            type: 'integer',
            description: 'The number of tokens in the request to the model.',
          },
          completion_tokens: {
            type: 'integer',
            description: 'The number of tokens in the response from the model.',
          },
          total_tokens: {
            type: 'integer',
            description: 'The sum of prompt and completion tokens.',
          },
        },
      },
      statistics: {
        type: 'object',
        description: 'The Assistant work statistics.',
        properties: {
          usage_per_model: {
            type: 'array',
            description:
              'Statistics of tokens used in models by the Assistant. In case of streaming, the statistics is published fully in one chunk.',
            items: {
              type: 'object',
            },
          },
          discarded_messages: {
            type: 'array',
            items: {
              type: 'integer',
            },
            description:
              'The list of indices of messages that were discarded by the Assistant. Returned only when `max_prompt_tokens` was set in the request.',
          },
        },
      },
      system_fingerprint: {
        type: 'string',
        description:
          'Can be used in conjunction with the `seed` request parameter to understand when backend changes have been made that might impact determinism.',
      },
    },
  },
};
