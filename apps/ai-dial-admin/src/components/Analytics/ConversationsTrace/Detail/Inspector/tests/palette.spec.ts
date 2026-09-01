import { describe, expect, test } from 'vitest';

import {
  HOP_EVENT_CHIP_CLASS,
  SPAN_KIND_CLASS,
  SPAN_KIND_EVENT_TYPE,
} from '@/src/constants/analytics/conversations-trace';
import { SpanKind } from '@/src/models/analytics/conversations-trace';

// The hue is the part that has to agree; the shape does not. A filter control is outlined and a rail badge is
// filled, so only the `text-*` token is compared.
const hueOf = (classes: string): string | undefined => classes.split(' ').find((name) => name.startsWith('text-'));

describe('the kind palette derives from the tree palette', () => {
  // One hop rendered two colours on one screen is the defect this guards: the tree coloured a model call
  // `accent-primary` while the rail badged the same hop `info`, and nothing connected the two sets.
  test.each(Object.values(SpanKind))('%s reads the same hue in the rail as in the tree', (kind) => {
    expect(hueOf(SPAN_KIND_CLASS[kind])).toBe(hueOf(HOP_EVENT_CHIP_CLASS[SPAN_KIND_EVENT_TYPE[kind]]));
  });

  test('every kind states a hue at all', () => {
    Object.values(SpanKind).forEach((kind) => expect(hueOf(SPAN_KIND_CLASS[kind])).toBeDefined());
  });
});
