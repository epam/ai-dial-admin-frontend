/**
 * DIAL's Anthropic Messages passthrough, shaped like `CREATE_RESPONSE_METHOD`.
 *
 * Every URL keeps DIAL's `/anthropic/v1` prefix, in the stored pattern, the seeded path, and the
 * displayed label alike. It is what tells the Evaluation Framework backend that a request targets
 * DIAL's Anthropic Messages passthrough rather than a `/messages` route the deployment happens to
 * expose itself, which would otherwise be routed to the wrong host.
 *
 * The schemas below are mapped from Anthropic's own Messages API document (`CreateMessageRequest`
 * → request, `Message` → response), with the same deviation `responses-method.ts` documents for
 * Responses: `model` is typed as a plain string described as a deployment id, rather than an enum of
 * Anthropic model names — the value that belongs here is a DIAL deployment id.
 *
 * The content-block unions on both sides are represented by their discriminator plus the variants a
 * test suite actually exercises, not the document's full expansion — `convertSchemaToTable` renders
 * only top-level properties, so a full expansion would be invisible in the table and unreadable in
 * the JSON view.
 *
 * Every top-level property carries an explicit `type`, including the union-valued ones, because a
 * property with only `oneOf` renders a blank Type cell in the schema table.
 */

export const ANTHROPIC_MESSAGES_URL_PREFIX = '/anthropic/v1';

export const ANTHROPIC_MESSAGES_RELATIVE_URL = `${ANTHROPIC_MESSAGES_URL_PREFIX}/messages`;

const CONTENT_TYPE_PARAMETER = {
  name: 'Content-Type',
  in: 'header',
  required: true,
  description: 'Must be application/json',
  schema: {
    type: 'string',
  },
};

const REQUEST_CONTENT_BLOCK = {
  oneOf: [
    {
      type: 'object',
      title: 'Text',
      required: ['type', 'text'],
      properties: {
        type: { type: 'string', enum: ['text'] },
        text: { type: 'string' },
      },
    },
    {
      type: 'object',
      title: 'Image',
      required: ['type', 'source'],
      properties: {
        type: { type: 'string', enum: ['image'] },
        source: { type: 'object', description: 'A base64, URL, or file source for the image.' },
      },
    },
    {
      type: 'object',
      title: 'Tool use',
      description: "A model-produced tool call, replayed back on an assistant message's content.",
      required: ['type', 'id', 'name', 'input'],
      properties: {
        type: { type: 'string', enum: ['tool_use'] },
        id: { type: 'string' },
        name: { type: 'string' },
        input: { type: 'object' },
      },
    },
    {
      type: 'object',
      title: 'Tool result',
      description: "The result of a tool call, sent back on a user message's content.",
      required: ['type', 'tool_use_id'],
      properties: {
        type: { type: 'string', enum: ['tool_result'] },
        tool_use_id: { type: 'string' },
        content: { type: 'string' },
        is_error: { type: 'boolean' },
      },
    },
  ],
};

const MESSAGE = {
  type: 'object',
  required: ['role', 'content'],
  properties: {
    role: { type: 'string', enum: ['user', 'assistant'] },
    content: {
      type: 'string',
      description: 'Message text, or an array of content blocks for images and tool use/results.',
      oneOf: [{ type: 'string' }, { type: 'array', items: REQUEST_CONTENT_BLOCK }],
    },
  },
};

const TOOL = {
  type: 'object',
  required: ['name', 'input_schema'],
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    input_schema: { type: 'object', description: 'JSON Schema describing the tool input.' },
  },
};

const TOOL_CHOICE = {
  type: 'string',
  description: 'auto, any, or none — or {"type":"tool","name":...} to force a specific tool.',
  oneOf: [
    { type: 'string', enum: ['auto', 'any', 'none'] },
    {
      type: 'object',
      required: ['type', 'name'],
      properties: {
        type: { type: 'string', enum: ['tool'] },
        name: { type: 'string' },
      },
    },
  ],
};

export const CREATE_MESSAGE_METHOD = {
  method: 'POST',
  operationId: 'createMessage',
  summary: ANTHROPIC_MESSAGES_RELATIVE_URL,
  relativeUrlPattern: ANTHROPIC_MESSAGES_RELATIVE_URL,
  description:
    'Creates a model response for the given conversation. Unlike chat completions, this endpoint is not parameterised on the deployment id, so the target deployment is selected by the `model` field in the request body.',
  parameters: [CONTENT_TYPE_PARAMETER],
  requestBodySchema: {
    contentType: 'application/json',
    schema: {
      type: 'object',
      required: ['model', 'messages', 'max_tokens'],
      properties: {
        model: {
          type: 'string',
          description: 'The id of the deployment to invoke.',
        },
        messages: {
          type: 'array',
          description: 'Input messages, alternating user and assistant turns.',
          items: MESSAGE,
        },
        max_tokens: {
          type: 'integer',
          description: 'The maximum number of tokens to generate before stopping.',
        },
        system: {
          type: 'string',
          description: 'System prompt, prepended before the first message.',
          oneOf: [{ type: 'string' }, { type: 'array', items: REQUEST_CONTENT_BLOCK }],
        },
        stop_sequences: {
          type: 'array',
          description: 'Custom sequences that, if generated, stop the response.',
          items: { type: 'string' },
        },
        temperature: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Sampling temperature, between 0 and 1.',
        },
        top_p: {
          type: 'number',
          description: 'Nucleus sampling probability mass.',
        },
        top_k: {
          type: 'integer',
          description: 'Only sample from the top K options for each token.',
        },
        tools: {
          type: 'array',
          description: 'Tools the model may call.',
          items: TOOL,
        },
        tool_choice: TOOL_CHOICE,
        stream: {
          type: 'boolean',
          description:
            'If true, the response is streamed as server-sent events. Test suites read the JSON response, so leave this unset.',
        },
        metadata: {
          type: 'object',
          description: 'Metadata about the request, e.g. an end-user identifier.',
        },
      },
    },
  },
  responseBodySchema: {
    type: 'object',
    required: ['id', 'type', 'role', 'content', 'model', 'stop_reason', 'usage'],
    properties: {
      id: { type: 'string', description: 'Unique identifier for this message.' },
      type: { type: 'string', enum: ['message'] },
      role: { type: 'string', enum: ['assistant'] },
      content: {
        type: 'array',
        description:
          'The generated content, in order. Assistant text lives in the text field of blocks whose type is text — there is no top-level text field on the wire.',
        items: {
          oneOf: [
            {
              type: 'object',
              title: 'Text',
              required: ['type', 'text'],
              properties: {
                type: { type: 'string', enum: ['text'] },
                text: { type: 'string', description: 'The generated text.' },
                citations: { type: 'array', items: { type: 'object' } },
              },
            },
            {
              type: 'object',
              title: 'Tool use',
              required: ['type', 'id', 'name', 'input'],
              properties: {
                type: { type: 'string', enum: ['tool_use'] },
                id: { type: 'string' },
                name: { type: 'string' },
                input: { type: 'object' },
              },
            },
            {
              type: 'object',
              title: 'Thinking',
              required: ['type', 'thinking'],
              properties: {
                type: { type: 'string', enum: ['thinking'] },
                thinking: { type: 'string' },
                signature: { type: 'string' },
              },
            },
            {
              type: 'object',
              title: 'Redacted thinking',
              description: 'Encrypted reasoning that was flagged by safety systems.',
              required: ['type', 'data'],
              properties: {
                type: { type: 'string', enum: ['redacted_thinking'] },
                data: { type: 'string' },
              },
            },
          ],
        },
      },
      model: { type: 'string', description: 'The deployment that generated the message.' },
      stop_reason: {
        type: 'string',
        enum: ['end_turn', 'max_tokens', 'stop_sequence', 'tool_use', 'pause_turn', 'refusal'],
      },
      stop_sequence: { type: 'string', description: 'The stop sequence that triggered stopping, if any.' },
      usage: {
        type: 'object',
        description: 'Token counts for the request and the generated output.',
        required: ['input_tokens', 'output_tokens'],
        properties: {
          input_tokens: { type: 'integer' },
          output_tokens: { type: 'integer' },
          cache_creation_input_tokens: { type: 'integer' },
          cache_read_input_tokens: { type: 'integer' },
        },
      },
    },
  },
};
