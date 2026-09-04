/**
 * `model` carries the target's deployment id rather than a template variable: DIAL's Responses API
 * endpoint has no deployment segment in its URL, so this field is what selects the deployment.
 * `reseedResponsesModel` keeps it in step when the suite's target changes.
 */
export const RESPONSES_BODY = (deploymentId: string) => ({
  model: deploymentId,
  input: '${{user_message}}',
});

/**
 * JSONata expression reaching the assistant's text in a create-response result.
 *
 * The response carries no top-level `output_text` — that is an SDK convenience accessor, not a wire
 * field. `Response.output` is an ordered array of items whose `type` discriminates them, and the
 * generated text lives in the `output_text` content parts of the items whose type is `message`.
 * Reasoning items and tool calls share the array, hence both filters.
 *
 * `$join` collapses the result to a single string: a model may split its answer across several text
 * parts or messages, and the column is declared as a string, so an unjoined multi-match would hand
 * the column an array.
 */
export const RESPONSES_ANSWER_EXPRESSION = "$join(output[type='message'].content[type='output_text'].text)";
