import { HopParam, HopParams } from '@/src/models/analytics/conversations-trace';
import { isRecord } from '@/src/utils/analytics/hop-inspector/envelope';

// Stated on every hop, with a null value where the body carried none. An absent `temperature` is a debugging
// answer — the call ran at the deployment's default — and a line that silently omits it cannot be told apart
// from one the reader did not read carefully.
// `tools` is the *catalogue*: how many tools the model was offered. It is stated under a label that says so,
// because the role filter one row below counts the tool *results* fed back — a turn offered 10 tools can
// answer with 20 results, and the two numbers sat next to each other reading as the same noun.
const ALWAYS_STATED = ['temperature', 'max_tokens', 'tools', 'stream'] as const;

// Stated first, and under a short label, because these are the settings a reader looks for by name. This is
// an ordering, not an allow-list: every other member of the body is stated too, after them, under its own
// recorded key.
const LABELLED = [
  // What the *client* asked for, which is not the deployment the hop row names: a deployment routes to a
  // model whose own id and version the row never records, and the two strings differ on real traffic. The
  // response states what actually answered; this states what was requested.
  'model',
  // The Responses dialect's own token cap — 185 of 199 hops carry it, and it is not `max_tokens`.
  'max_output_tokens',
  'top_p',
  'top_k',
  'tool_choice',
  'response_format',
  'seed',
  'reasoning_effort',
  'thinking',
  'stop',
  'stop_sequences',
  'presence_penalty',
  'frequency_penalty',
  'n',
  'max_completion_tokens',
];

// The only members left out: the ones that carry the conversation itself, which the history renders in full.
// `input` and `instructions` are the Responses dialect's spelling of `messages` and the system prompt.
//
// The DIAL state envelopes are deliberately *not* among them. They are blobs, so they state the names of what
// they carry rather than the values — and that is worth stating: an envelope is why a message's recorded size
// can run far past its visible text, and a reader comparing the two has no other way to see that it is there.
const STRUCTURAL = new Set(['messages', 'system', 'input', 'instructions']);

// An array states how many members it had — `tools` is a catalogue, and the count is the answer. An object
// states *which* members: a lone `1` under `stream_options` says something is set while refusing to say what,
// which is the one thing a reader debugging a call cannot use.
const scalarOf = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    return String(value.length);
  }

  if (isRecord(value)) {
    const keys = Object.keys(value);

    return keys.length ? keys.join(', ') : String(keys.length);
  }

  return value == null ? null : String(value);
};

// Presence is "not null", never truthiness. `temperature: 0` is real and common — the value a reader most
// often wants confirmed — and `stream: false` is the fact that explains an unframed response. A truthiness
// test reports both as absent, which is the opposite of what the body says.
const isPresent = (body: Record<string, unknown>, name: string): boolean => name in body && body[name] != null;

// Takes the *parsed* body, like every other parser in this folder: parsing here as well meant tier 1 ran
// `JSON.parse` twice over the same string, and 21% of request bodies are above 100 KB.
export const paramsOf = (parsed: unknown): HopParams => {
  if (!isRecord(parsed)) {
    return { stated: ALWAYS_STATED.map((name) => ({ name, value: null })), rest: [] };
  }

  const stated: HopParam[] = ALWAYS_STATED.map((name) => ({
    name,
    value: isPresent(parsed, name) ? scalarOf(parsed[name]) : null,
  }));

  for (const name of LABELLED) {
    if (isPresent(parsed, name)) {
      stated.push({ name, value: scalarOf(parsed[name]) });
    }
  }

  // Everything else the body carried is counted rather than listed. A parameter this frontend has never met is
  // still one the call was made with, so it is never dropped — but a line stating every member made the reader
  // read a paragraph to find the four settings they came for. The names travel with the count.
  const ordered = new Set<string>([...ALWAYS_STATED, ...LABELLED]);
  const rest = Object.keys(parsed).filter(
    (name) => !ordered.has(name) && !STRUCTURAL.has(name) && isPresent(parsed, name),
  );

  return { stated, rest };
};
