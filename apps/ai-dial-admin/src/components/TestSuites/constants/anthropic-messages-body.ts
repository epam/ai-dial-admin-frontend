/**
 * `model` carries the target's deployment id rather than a template variable.
 * `reseedAnthropicMessagesModel` keeps it in step when the suite's target changes.
 */
export const ANTHROPIC_MESSAGES_BODY = (deploymentId: string) => ({
  model: deploymentId,
  max_tokens: 1024,
  messages: [{ role: 'user', content: '${{user_message}}' }],
});

/**
 * JSONata expression reaching the assistant's text in a create-message result.
 *
 * The response carries no top-level text field: `content` is an ordered array of blocks
 * discriminated by `type`, and the generated text lives in the `text` field of blocks whose type is
 * `text`, alongside any tool-use or thinking blocks.
 *
 * `$join` collapses the result to a single string: a model may split its answer across several text
 * blocks, and the column is declared as a string, so an unjoined multi-match would hand the column
 * an array.
 */
export const ANTHROPIC_MESSAGES_ANSWER_EXPRESSION = "$join(content[type='text'].text)";
