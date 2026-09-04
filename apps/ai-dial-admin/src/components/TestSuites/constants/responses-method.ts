/**
 * DIAL's OpenAI Responses API operations, shaped like `CHAT_COMPLETION_METHOD`.
 *
 * `relativeUrlPattern` is expressed as a regex, because `MethodInfo` validates the user-editable
 * final path against it: a literal `{response_id}` pattern would reject every real response id. The
 * readable form lives in `summary`.
 *
 * Every URL keeps DIAL's `/openai/v1` prefix, in the stored pattern, the seeded path, and the
 * displayed label alike. It is not decoration: it is what tells the Evaluation Framework backend that
 * a request targets DIAL's Responses API rather than a `/responses` route the deployment happens to
 * expose itself, which would otherwise be routed to the wrong host. `/chat/completions` needs no
 * equivalent because its own URL is parameterised on the deployment.
 *
 * DIAL's own OpenAPI declares `ResponsesApiRequest` as a bare `type: object`, so the create
 * operation's schemas below are mapped from the OpenAI Responses API document (`CreateResponseRequest`
 * → request, `Response` → response). Three deliberate deviations from that document:
 *
 * - `model` is typed as a plain string and described as a deployment id, rather than carrying the
 *   document's enum of OpenAI model names — the value that belongs here is a DIAL deployment id.
 * - `model` and `input` are marked required. The document marks neither (`model` can arrive via
 *   `prompt`, and `input` via `conversation`), but DIAL's endpoint has no deployment segment in its
 *   URL, so `model` is the only deployment selector, and a test suite with no input does nothing.
 * - The deep unions — `ResponseInputItem` (33 variants), `Tool` (16), `ResponseOutputItem` (28) — are
 *   represented by their discriminator plus the variants a test suite actually exercises, not
 *   inlined whole. `convertSchemaToTable` renders only top-level properties, so the full expansion
 *   would be invisible in the table and unreadable in the JSON view.
 *
 * Every top-level property carries an explicit `type`, including the union-valued ones, because a
 * property with only `oneOf` renders a blank Type cell in the schema table.
 */

/** DIAL's Responses API prefix. Stated once here; every URL form below is built from it. */
export const RESPONSES_URL_PREFIX = '/openai/v1';

export const RESPONSES_RELATIVE_URL = `${RESPONSES_URL_PREFIX}/responses`;
export const RESPONSE_ITEM_RELATIVE_URL_PATTERN = `${RESPONSES_RELATIVE_URL}/[^/]+`;
export const RESPONSE_CANCEL_RELATIVE_URL_PATTERN = `${RESPONSE_ITEM_RELATIVE_URL_PATTERN}/cancel`;

/** Readable forms shown in the method sidebar, with the placeholder in place of the id regex. */
export const RESPONSE_ITEM_DISPLAY_URL = `${RESPONSES_RELATIVE_URL}/{response_id}`;
export const RESPONSE_CANCEL_DISPLAY_URL = `${RESPONSE_ITEM_DISPLAY_URL}/cancel`;

export const RESPONSE_ID_VARIABLE = 'response_id';
export const RESPONSE_ITEM_URL_TEMPLATE = `${RESPONSES_RELATIVE_URL}/\${{${RESPONSE_ID_VARIABLE}}}`;
export const RESPONSE_CANCEL_URL_TEMPLATE = `${RESPONSE_ITEM_URL_TEMPLATE}/cancel`;

const CACHE_POLICY_PARAMETER = {
  name: 'X-DIAL-CACHE-POLICY',
  in: 'header',
  required: false,
  schema: {
    type: 'string',
    enum: ['availability-priority', 'cache-priority'],
    description: 'Upstream selection policy for prompt-caching deployments (availability-priority or cache-priority).',
  },
};

const CONTENT_TYPE_PARAMETER = {
  name: 'Content-Type',
  in: 'header',
  required: true,
  description: 'Must be application/json',
  schema: {
    type: 'string',
  },
};

const RESPONSE_ID_PARAMETER = {
  name: 'response_id',
  in: 'path',
  required: true,
  schema: {
    type: 'string',
  },
};

/** `ResponseInputText` / `ResponseInputImage` / `ResponseInputFile` — the content parts of a message. */
const INPUT_CONTENT_PART = {
  oneOf: [
    {
      type: 'object',
      title: 'Input text',
      required: ['type', 'text'],
      properties: {
        type: { type: 'string', enum: ['input_text'] },
        text: { type: 'string' },
      },
    },
    {
      type: 'object',
      title: 'Input image',
      required: ['type'],
      properties: {
        type: { type: 'string', enum: ['input_image'] },
        detail: { type: 'string', enum: ['low', 'high', 'auto', 'original'] },
        file_id: { type: 'string' },
        image_url: { type: 'string', description: 'A fully qualified URL or a base64 data URL.' },
      },
    },
    {
      type: 'object',
      title: 'Input file',
      required: ['type'],
      properties: {
        type: { type: 'string', enum: ['input_file'] },
        detail: { type: 'string', enum: ['auto', 'low', 'high'] },
        file_data: { type: 'string', description: 'Base64-encoded file content.' },
        file_id: { type: 'string' },
        file_url: { type: 'string' },
        filename: { type: 'string' },
      },
    },
  ],
};

/**
 * One entry of the `input` array. The document's `ResponseInputItem` is a 33-variant union
 * discriminated on `type`; the message variants are what a test suite sends, and the remaining
 * variants (tool calls, tool outputs, reasoning, compaction, item references) are the items a model
 * produced, replayed back on a later turn.
 */
const INPUT_ITEM = {
  oneOf: [
    {
      type: 'object',
      title: 'Message',
      description: 'A message from the user, assistant, system, or developer.',
      required: ['role', 'content'],
      properties: {
        type: { type: 'string', enum: ['message'] },
        role: { type: 'string', enum: ['user', 'assistant', 'system', 'developer'] },
        content: {
          type: 'string',
          description: 'Message text, or an array of content parts for images and files.',
          oneOf: [{ type: 'string' }, { type: 'array', items: INPUT_CONTENT_PART }],
        },
        phase: {
          type: 'string',
          enum: ['commentary', 'final_answer'],
          description: 'Labels an assistant message as intermediate commentary or the final answer.',
        },
      },
    },
    {
      type: 'object',
      title: 'Item reference',
      description: 'References an item that already exists on the conversation.',
      required: ['id'],
      properties: {
        type: { type: 'string', enum: ['item_reference'] },
        id: { type: 'string' },
      },
    },
    {
      type: 'object',
      title: 'Model-produced item',
      description:
        'Any other item from the response `output` array — a tool call, a tool output, a reasoning item, a compaction item — replayed back to the model. Discriminated on `type`; see the response schema.',
      required: ['type'],
      properties: {
        type: { type: 'string' },
        id: { type: 'string' },
      },
    },
  ],
};

/**
 * One entry of `tools`. The document's `Tool` union has 16 variants discriminated on `type`; only
 * `function` and `custom` carry a caller-defined shape, so the rest are covered by the discriminator.
 */
const TOOL = {
  oneOf: [
    {
      type: 'object',
      title: 'Function tool',
      required: ['type', 'name'],
      properties: {
        type: { type: 'string', enum: ['function'] },
        name: { type: 'string' },
        description: { type: 'string' },
        parameters: { type: 'object', description: 'JSON Schema describing the function parameters.' },
        output_schema: { type: 'object' },
        strict: { type: 'boolean', description: 'Whether strict parameter validation is enforced.' },
        async: { type: 'boolean' },
        defer_loading: { type: 'boolean', description: 'Whether the function is loaded via tool search.' },
      },
    },
    {
      type: 'object',
      title: 'Custom tool',
      required: ['type', 'name'],
      properties: {
        type: { type: 'string', enum: ['custom'] },
        name: { type: 'string' },
        description: { type: 'string' },
        format: { type: 'object', description: 'Free-text input, or a lark/regex grammar.' },
      },
    },
    {
      type: 'object',
      title: 'Built-in tool',
      description:
        'A tool hosted by the provider, configured by its own fields: file_search, web_search, web_search_preview, computer, computer_use_preview, mcp, code_interpreter, image_generation, local_shell, shell, namespace, tool_search, apply_patch, programmatic_tool_calling.',
      required: ['type'],
      properties: {
        type: { type: 'string' },
      },
    },
  ],
};

/** `Reasoning` — shared by the request and the response. */
const REASONING = {
  type: 'object',
  description: 'Configuration for reasoning models.',
  properties: {
    effort: {
      type: 'string',
      enum: ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'],
      description: 'How much reasoning effort to spend before answering.',
    },
    context: {
      type: 'string',
      enum: ['auto', 'current_turn', 'all_turns'],
      description: 'Which reasoning items are rendered back to the model on later turns.',
    },
    mode: { type: 'string', description: 'Reasoning execution mode, e.g. standard or pro.' },
    summary: { type: 'string', enum: ['auto', 'concise', 'detailed'] },
    generate_summary: {
      type: 'string',
      enum: ['auto', 'concise', 'detailed'],
      description: 'Deprecated: use summary.',
    },
  },
};

/** `ResponseTextConfig` — shared by the request and the response. */
const TEXT_CONFIG = {
  type: 'object',
  description: 'Configuration for the textual output, including structured-output formats.',
  properties: {
    format: {
      type: 'object',
      description: 'text, json_object, or json_schema. Discriminated on `type`.',
      required: ['type'],
      properties: {
        type: { type: 'string', enum: ['text', 'json_object', 'json_schema'] },
        name: { type: 'string', description: 'Required for json_schema.' },
        schema: { type: 'object', description: 'Required for json_schema.' },
        description: { type: 'string' },
        strict: { type: 'boolean' },
      },
    },
    verbosity: { type: 'string', enum: ['low', 'medium', 'high'] },
  },
};

/** `ToolChoice` — a keyword, or an object naming the tool to force. */
const TOOL_CHOICE = {
  type: 'string',
  description:
    'none, auto, or required — or an object forcing a specific tool: {"type":"function","name":...}, {"type":"mcp","server_label":...}, {"type":"custom","name":...}, {"type":"allowed_tools","mode":...,"tools":[...]}, or a bare built-in tool type.',
  oneOf: [
    { type: 'string', enum: ['none', 'auto', 'required'] },
    {
      type: 'object',
      required: ['type'],
      properties: {
        type: { type: 'string' },
        name: { type: 'string' },
        mode: { type: 'string', enum: ['auto', 'required'] },
        server_label: { type: 'string' },
        tools: { type: 'array', items: { type: 'object' } },
      },
    },
  ],
};

/** `ResponsePrompt` — a reference to a stored prompt template. */
const PROMPT_REFERENCE = {
  type: 'object',
  description: 'Reference to a prompt template and its variables.',
  required: ['id'],
  properties: {
    id: { type: 'string' },
    version: { type: 'string' },
    variables: {
      type: 'object',
      description: 'Template variable values: a string, or an input text / image / file content part.',
    },
  },
};

const METADATA = {
  type: 'object',
  description: 'Up to 16 key-value pairs. Keys are at most 64 characters, values at most 512.',
};

export const CREATE_RESPONSE_METHOD = {
  method: 'POST',
  operationId: 'createResponse',
  summary: RESPONSES_RELATIVE_URL,
  relativeUrlPattern: RESPONSES_RELATIVE_URL,
  description:
    'Creates a model response for the given input. Unlike chat completions, this endpoint is not parameterised on the deployment id, so the target deployment is selected by the `model` field in the request body.',
  parameters: [CONTENT_TYPE_PARAMETER, CACHE_POLICY_PARAMETER],
  requestBodySchema: {
    contentType: 'application/json',
    schema: {
      type: 'object',
      required: ['model', 'input'],
      properties: {
        model: {
          type: 'string',
          description: 'The id of the deployment to invoke.',
        },
        input: {
          type: 'string',
          description:
            'A text prompt, equivalent to a single user message — or an array of input items for multi-turn input, images, files, and replayed tool calls.',
          oneOf: [
            { type: 'string', description: 'A text input to the model, equivalent to a user-role text message.' },
            { type: 'array', items: INPUT_ITEM },
          ],
        },
        instructions: {
          type: 'string',
          description:
            "A system (or developer) message inserted into the model's context. Not carried over when used with previous_response_id.",
          oneOf: [{ type: 'string' }, { type: 'array', items: INPUT_ITEM }],
        },
        conversation: {
          type: 'string',
          description:
            'The conversation this response belongs to, as an id or {"id":...}. Items are prepended to the input and outputs appended afterwards. Cannot be combined with previous_response_id.',
          oneOf: [
            { type: 'string', description: 'The unique id of the conversation.' },
            { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
          ],
        },
        previous_response_id: {
          type: 'string',
          description: 'Id of the previous response, to continue from it. Cannot be combined with conversation.',
        },
        background: {
          type: 'boolean',
          description: 'Whether to run the model response in the background.',
        },
        stream: {
          type: 'boolean',
          description:
            'If true, the response is streamed as server-sent events. Test suites read the JSON response, so leave this unset.',
        },
        stream_options: {
          type: 'object',
          description: 'Only meaningful when stream is true.',
          properties: {
            include_obfuscation: { type: 'boolean' },
          },
        },
        store: {
          type: 'boolean',
          description:
            'Whether to store the generated response for later retrieval. Required for the retrieve, delete, and cancel operations to find it.',
        },
        include: {
          type: 'array',
          description:
            'Additional output data to include, e.g. reasoning.encrypted_content or web_search_call.results.',
          items: {
            type: 'string',
            enum: [
              'file_search_call.results',
              'web_search_call.results',
              'web_search_call.action.sources',
              'message.input_image.image_url',
              'computer_call_output.output.image_url',
              'code_interpreter_call.outputs',
              'reasoning.encrypted_content',
              'message.output_text.logprobs',
            ],
          },
        },
        max_output_tokens: {
          type: 'integer',
          description: 'Upper bound for generated tokens, including visible output and reasoning tokens.',
        },
        max_tool_calls: {
          type: 'integer',
          description: 'Maximum total number of built-in tool calls processed in a response.',
        },
        temperature: {
          type: 'number',
          minimum: 0,
          maximum: 2,
          description: 'Sampling temperature, between 0 and 2.',
        },
        top_p: {
          type: 'number',
          description: 'Nucleus sampling probability mass.',
        },
        top_logprobs: {
          type: 'integer',
          minimum: 0,
          maximum: 20,
          description: 'Number of most likely tokens to return log probabilities for.',
        },
        text: TEXT_CONFIG,
        reasoning: REASONING,
        tools: {
          type: 'array',
          description: 'Tools the model may call. Discriminated on `type`.',
          items: TOOL,
        },
        tool_choice: TOOL_CHOICE,
        parallel_tool_calls: {
          type: 'boolean',
          description: 'Whether to allow the model to run tool calls in parallel.',
        },
        truncation: {
          type: 'string',
          enum: ['auto', 'disabled'],
          description:
            'auto drops items from the beginning to fit the context window; disabled (the default) fails with 400 instead.',
        },
        context_management: {
          type: 'array',
          description: 'Context compaction settings.',
          items: {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string', description: 'Currently only compaction is supported.' },
              compact_threshold: { type: 'integer', description: 'Token threshold at which compaction is triggered.' },
            },
          },
        },
        prompt: PROMPT_REFERENCE,
        prompt_cache_key: {
          type: 'string',
          description: 'Used to optimize prompt cache hit rates. Replaces the deprecated user field.',
        },
        prompt_cache_options: {
          type: 'object',
          description: 'Prompt caching options. Supported for gpt-5.6 and later models.',
          properties: {
            mode: {
              type: 'string',
              enum: ['implicit', 'explicit'],
              description:
                'implicit (default) adds one implicit breakpoint plus up to three explicit; explicit uses only up to four explicit breakpoints.',
            },
            ttl: { type: 'string', enum: ['30m'] },
            comparison_response_id: {
              type: 'string',
              description: 'Response id to compare against when diagnosing prompt cache reuse.',
            },
          },
        },
        prompt_cache_retention: {
          type: 'string',
          enum: ['in_memory', '24h'],
          description: 'Deprecated: use prompt_cache_options.ttl.',
        },
        moderation: {
          type: 'object',
          description: 'Moderation model and policy applied to the input and the output.',
          required: ['model'],
          properties: {
            model: { type: 'string', description: 'The moderation model to use, e.g. omni-moderation-latest.' },
            policy: {
              type: 'object',
              properties: {
                input: {
                  type: 'object',
                  required: ['mode'],
                  properties: { mode: { type: 'string', enum: ['score', 'block'] } },
                },
                output: {
                  type: 'object',
                  required: ['mode'],
                  properties: { mode: { type: 'string', enum: ['score', 'block'] } },
                },
              },
            },
          },
        },
        service_tier: {
          type: 'string',
          enum: ['auto', 'default', 'flex', 'scale', 'priority', 'fast', 'ultrafast'],
          description: 'Processing tier used to serve the request.',
        },
        safety_identifier: {
          type: 'string',
          maxLength: 64,
          description: 'Stable, hashed identifier of the end user, for abuse detection.',
        },
        metadata: METADATA,
        user: {
          type: 'string',
          description: 'Deprecated: replaced by safety_identifier and prompt_cache_key.',
        },
      },
    },
  },
  responseBodySchema: {
    type: 'object',
    required: [
      'id',
      'object',
      'created_at',
      'error',
      'incomplete_details',
      'instructions',
      'metadata',
      'model',
      'output',
      'parallel_tool_calls',
      'temperature',
      'tool_choice',
      'tools',
      'top_p',
    ],
    properties: {
      id: { type: 'string', description: 'Unique identifier for this response.' },
      object: { type: 'string', enum: ['response'] },
      created_at: { type: 'number', description: 'Unix timestamp, in seconds, of when the response was created.' },
      completed_at: {
        type: 'number',
        description: 'Unix timestamp, in seconds. Only present when status is completed.',
      },
      status: {
        type: 'string',
        enum: ['completed', 'failed', 'in_progress', 'cancelled', 'queued', 'incomplete'],
      },
      output: {
        type: 'array',
        description:
          'The items the model generated, in order. Assistant text lives in the content of the items whose type is message — there is no top-level output_text field on the wire.',
        items: {
          oneOf: [
            {
              type: 'object',
              title: 'Output message',
              description: 'An assistant message. Carries the generated text.',
              required: ['id', 'type', 'role', 'content', 'status'],
              properties: {
                id: { type: 'string' },
                type: { type: 'string', enum: ['message'] },
                role: { type: 'string', enum: ['assistant'] },
                status: { type: 'string', enum: ['in_progress', 'completed', 'incomplete'] },
                content: {
                  type: 'array',
                  description: 'Output text parts and refusals, discriminated on `type`.',
                  items: {
                    oneOf: [
                      {
                        type: 'object',
                        title: 'Output text',
                        required: ['type', 'text', 'annotations'],
                        properties: {
                          type: { type: 'string', enum: ['output_text'] },
                          text: { type: 'string', description: 'The generated text.' },
                          annotations: {
                            type: 'array',
                            description:
                              'File citations, URL citations, container file citations, and file paths, discriminated on `type`.',
                            items: { type: 'object', required: ['type'], properties: { type: { type: 'string' } } },
                          },
                          logprobs: { type: 'array', items: { type: 'object' } },
                        },
                      },
                      {
                        type: 'object',
                        title: 'Refusal',
                        required: ['type', 'refusal'],
                        properties: {
                          type: { type: 'string', enum: ['refusal'] },
                          refusal: { type: 'string' },
                        },
                      },
                    ],
                  },
                },
                phase: { type: 'string', enum: ['commentary', 'final_answer'] },
              },
            },
            {
              type: 'object',
              title: 'Reasoning item',
              required: ['id', 'type', 'summary'],
              properties: {
                id: { type: 'string' },
                type: { type: 'string', enum: ['reasoning'] },
                summary: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['type', 'text'],
                    properties: { type: { type: 'string', enum: ['summary_text'] }, text: { type: 'string' } },
                  },
                },
                content: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['type', 'text'],
                    properties: { type: { type: 'string', enum: ['reasoning_text'] }, text: { type: 'string' } },
                  },
                },
                encrypted_content: {
                  type: 'string',
                  description: 'Encrypted reasoning; resend in later turns when stateless or under ZDR.',
                },
                status: { type: 'string', enum: ['in_progress', 'completed', 'incomplete'] },
              },
            },
            {
              type: 'object',
              title: 'Tool call or tool output',
              description:
                'One of function_call, function_call_output, file_search_call, web_search_call, computer_call, computer_call_output, code_interpreter_call, image_generation_call, mcp_call, mcp_list_tools, mcp_approval_request, mcp_approval_response, custom_tool_call, custom_tool_call_output, local_shell_call, local_shell_call_output, shell_call, shell_call_output, apply_patch_call, apply_patch_call_output, tool_search_call, tool_search_output, additional_tools, compaction, program, program_output. Discriminated on `type`.',
              required: ['type'],
              properties: {
                type: { type: 'string' },
                id: { type: 'string' },
                call_id: { type: 'string' },
                name: { type: 'string' },
                arguments: { type: 'string', description: 'JSON string of the call arguments.' },
                output: { type: 'string' },
                status: { type: 'string' },
              },
            },
          ],
        },
      },
      error: {
        type: 'object',
        description: 'Set when the model failed to generate a response. Null on success.',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string', description: 'e.g. server_error, rate_limit_exceeded, invalid_prompt.' },
          message: { type: 'string' },
          misalignment: {
            type: 'object',
            properties: {
              detailed_explanation: { type: 'string' },
              error_type: { type: 'string', description: 'Clients must accept values beyond those documented.' },
              steer: { type: 'object', required: ['message'], properties: { message: { type: 'string' } } },
            },
          },
        },
      },
      incomplete_details: {
        type: 'object',
        description: 'Why the response is incomplete. Null when it is not.',
        properties: {
          reason: { type: 'string', enum: ['max_output_tokens', 'max_messages', 'content_filter', 'steered'] },
        },
      },
      model: { type: 'string', description: 'The deployment that generated the response.' },
      instructions: {
        type: 'string',
        description: 'The system or developer message inserted into the context, as sent.',
        oneOf: [{ type: 'string' }, { type: 'array', items: INPUT_ITEM }],
      },
      conversation: {
        type: 'object',
        description: 'The conversation this response belongs to.',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
      previous_response_id: { type: 'string' },
      background: { type: 'boolean' },
      max_output_tokens: { type: 'integer' },
      max_tool_calls: { type: 'integer' },
      parallel_tool_calls: { type: 'boolean' },
      temperature: { type: 'number' },
      top_p: { type: 'number' },
      top_logprobs: { type: 'integer' },
      truncation: { type: 'string', enum: ['auto', 'disabled'] },
      text: TEXT_CONFIG,
      reasoning: REASONING,
      tools: { type: 'array', description: 'The tools the model could call.', items: TOOL },
      tool_choice: TOOL_CHOICE,
      prompt: PROMPT_REFERENCE,
      prompt_cache_key: { type: 'string' },
      prompt_cache_options: {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['implicit', 'explicit'] },
          ttl: { type: 'string', enum: ['30m'] },
          comparison_response_id: { type: 'string' },
        },
      },
      prompt_cache_retention: {
        type: 'string',
        enum: ['in_memory', '24h'],
        description: 'Deprecated: use prompt_cache_options.ttl.',
      },
      prompt_cache_diagnostics: {
        type: 'object',
        description: 'Why the prompt cache hit or missed. Discriminated on `type`.',
        required: ['type'],
        properties: {
          type: { type: 'string', enum: ['cache_hit', 'cache_miss', 'comparison_response_not_found', 'unavailable'] },
          cache_missed_tokens: { type: 'integer' },
          comparison_reusable_tokens: { type: 'integer' },
          reason: {
            type: 'string',
            description:
              'On a miss: model_changed, prompt_cache_key_changed, tools_changed, text_format_changed, reasoning_effort_changed, verbosity_changed, context_compacted, input_changed, or service_tier_changed.',
          },
        },
      },
      moderation: {
        type: 'object',
        description: 'Moderation results for the input and the output.',
        required: ['input', 'output'],
        properties: {
          input: { type: 'object' },
          output: { type: 'object' },
        },
      },
      service_tier: {
        type: 'string',
        enum: ['auto', 'default', 'flex', 'scale', 'priority', 'fast', 'ultrafast'],
      },
      safety_identifier: { type: 'string' },
      metadata: METADATA,
      usage: {
        type: 'object',
        description: 'Token counts for the request and the generated output.',
        required: ['input_tokens', 'input_tokens_details', 'output_tokens', 'output_tokens_details', 'total_tokens'],
        properties: {
          input_tokens: { type: 'integer' },
          input_tokens_details: {
            type: 'object',
            required: ['cached_tokens', 'cache_write_tokens'],
            properties: {
              cached_tokens: { type: 'integer' },
              cache_write_tokens: { type: 'integer' },
            },
          },
          output_tokens: { type: 'integer' },
          output_tokens_details: {
            type: 'object',
            required: ['reasoning_tokens'],
            properties: { reasoning_tokens: { type: 'integer' } },
          },
          total_tokens: { type: 'integer' },
        },
      },
      user: { type: 'string', description: 'Deprecated: replaced by safety_identifier and prompt_cache_key.' },
    },
  },
};

export const GET_RESPONSE_METHOD = {
  method: 'GET',
  operationId: 'getResponseItem',
  summary: RESPONSE_ITEM_DISPLAY_URL,
  relativeUrlPattern: RESPONSE_ITEM_RELATIVE_URL_PATTERN,
  description: 'Retrieves a previously created response by its id.',
  parameters: [RESPONSE_ID_PARAMETER],
};

export const DELETE_RESPONSE_METHOD = {
  method: 'DELETE',
  operationId: 'deleteResponseItem',
  summary: RESPONSE_ITEM_DISPLAY_URL,
  relativeUrlPattern: RESPONSE_ITEM_RELATIVE_URL_PATTERN,
  description: 'Deletes a previously created response by its id.',
  parameters: [RESPONSE_ID_PARAMETER],
};

export const CANCEL_RESPONSE_METHOD = {
  method: 'POST',
  operationId: 'cancelResponseItem',
  summary: RESPONSE_CANCEL_DISPLAY_URL,
  relativeUrlPattern: RESPONSE_CANCEL_RELATIVE_URL_PATTERN,
  description: 'Cancels a response that is still in progress.',
  parameters: [RESPONSE_ID_PARAMETER],
};
