import { RAW_BODY_BYTE_BUDGET } from '@/src/constants/analytics/conversations-trace';
import {
  ConversationEntryBodyRow,
  HopEmbeddingFacts,
  HopReadState,
  HopSideGrants,
} from '@/src/models/analytics/conversations-trace';
import { NO_CLAMP, asRecords, clampToBudget, isRecord, parseJson } from '@/src/utils/analytics/hop-inspector/envelope';

const FLOAT32_BYTES = 4;
const BASE64_UNITS = 4;
const BASE64_BYTES = 3;

// 96% of recorded vectors arrive base64-encoded, so the dimension count is derived from the encoded length
// rather than from an array that is usually not there. The vector itself is never rendered: any depiction of
// one means decoding it first, for decoration, when the question is what was embedded.
const dimensionsOf = (embedding: unknown): number | null => {
  if (Array.isArray(embedding)) {
    return embedding.length;
  }

  if (typeof embedding !== 'string' || embedding.length === 0) {
    return null;
  }

  const padding = embedding.endsWith('==') ? 2 : Number(embedding.endsWith('='));

  return Math.floor((embedding.length / BASE64_UNITS) * BASE64_BYTES - padding) / FLOAT32_BYTES;
};

const inputTextOf = (input: unknown): string | null => {
  if (typeof input === 'string') {
    return input;
  }

  if (!Array.isArray(input)) {
    return null;
  }

  const texts = input.filter((item): item is string => typeof item === 'string');

  return texts.length ? texts.join('\n') : null;
};

const inputCountOf = (input: unknown): number | null => {
  if (typeof input === 'string') {
    return 1;
  }

  return Array.isArray(input) ? input.length : null;
};

const WITHHELD: HopEmbeddingFacts = {
  state: HopReadState.ColumnWithheld,
  model: null,
  inputCount: null,
  dimensions: null,
  inputText: null,
  inputClamp: NO_CLAMP,
  isDimensionsWithheld: false,
};

export const embeddingFactsOf = (row: ConversationEntryBodyRow, grants: HopSideGrants): HopEmbeddingFacts => {
  // Everything but the dimension count comes from the request column, so a caller denied that column is
  // denied the panel — not shown an embedding that appears to have recorded nothing.
  if (!grants.isRequestReadable) {
    return WITHHELD;
  }

  const request = parseJson(row.request_body);
  const response = grants.isResponseReadable ? parseJson(row.response_body ?? null) : null;
  const [first] = isRecord(response) ? asRecords(response.data) : [];
  const input = isRecord(request) ? request.input : null;
  // Clamped like every other body-derived text. A single input averages 352 B, but the endpoint takes an
  // array — and a batch is one string here, which is the one path that walked past the payload budget.
  const clamped = clampToBudget(inputTextOf(input), RAW_BODY_BYTE_BUDGET);

  return {
    state: clamped.text === null ? HopReadState.NoBody : HopReadState.Available,
    model: isRecord(request) && typeof request.model === 'string' ? request.model : null,
    inputCount: inputCountOf(input),
    dimensions: first ? dimensionsOf(first.embedding) : null,
    inputText: clamped.text,
    inputClamp: clamped.clamp,
    isDimensionsWithheld: !grants.isResponseReadable,
  };
};
