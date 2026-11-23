import { describe, expect, test } from 'vitest';

import { extractPlaceholders } from '@/src/utils/analytics/template-placeholders';

describe('Utils :: analytics :: extractPlaceholders', () => {
  test('reads every placeholder a template references', () => {
    expect(extractPlaceholders('{"content":"Read {{request}} and {{response}}"}')).toEqual(['request', 'response']);
  });

  test('tolerates the whitespace the service tolerates', () => {
    expect(extractPlaceholders('{{ members }}')).toEqual(['members']);
  });

  test('reads a placeholder carrying the json suffix as a use of its name', () => {
    expect(extractPlaceholders('{"members": {{members:json}}, "note": "{{ note:json }}"}')).toEqual([
      'members',
      'note',
    ]);
  });

  test('reports a name used in both forms once', () => {
    expect(extractPlaceholders('{{payload}} and {{payload:json}}')).toEqual(['payload']);
  });

  test('reports a repeated placeholder once', () => {
    expect(extractPlaceholders('{{a}} then {{a}}')).toEqual(['a']);
  });

  test('ignores a name outside the grammar the service accepts', () => {
    expect(extractPlaceholders('{{with-hyphen}} {{with space}}')).toEqual([]);
  });

  test('reads no template as no placeholders', () => {
    expect(extractPlaceholders()).toEqual([]);
    expect(extractPlaceholders('')).toEqual([]);
  });
});
