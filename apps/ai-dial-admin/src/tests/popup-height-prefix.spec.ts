import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const SRC_DIR = path.resolve(process.cwd(), 'src');
const POPUP_TAG = /<Popup\b/;
const PROP_INDENT_STEP = 2;

const indentOf = (line: string): number => line.length - line.trimStart().length;

const hasUnprefixedHeight = (classNameValue: string): boolean =>
  (classNameValue.match(/(["'`])(.*?)\1/g) ?? []).some((literal) =>
    literal
      .slice(1, -1)
      .split(/\s+/)
      .some((token) => token.startsWith('h-')),
  );

/**
 * Returns the 1-based line of every `<Popup>` `className` that carries an unprefixed `h-*` token.
 * Props are read by indentation (tag indent + 2) so JSX nested inside a prop such as `header` is skipped.
 */
export function findUnprefixedPopupHeights(source: string): number[] {
  const lines = source.split(/\r?\n/);
  const found: number[] = [];

  lines.forEach((tagLine, tagIndex) => {
    if (!POPUP_TAG.test(tagLine)) return;

    const tagIndent = indentOf(tagLine);
    const sameLine = tagLine.match(/\sclassName=(\{.*?\}|".*?")/);
    if (sameLine && hasUnprefixedHeight(sameLine[1])) found.push(tagIndex + 1);

    for (let i = tagIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '') continue;
      if (indentOf(line) <= tagIndent) break;

      const prop = indentOf(line) === tagIndent + PROP_INDENT_STEP && line.trim().match(/^className=(.*)$/);
      if (prop && hasUnprefixedHeight(prop[1])) found.push(i + 1);
    }
  });

  return found;
}

const collectSources = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : collectSources(fullPath);
    return /\.tsx$/.test(entry.name) && !/\.spec\./.test(entry.name) ? [fullPath] : [];
  });

const popup = (className: string) => `  <Popup\n    open\n    className=${className}\n  >\n  </Popup>`;

describe('findUnprefixedPopupHeights', () => {
  test('passes a breakpoint-prefixed height', () => {
    expect(findUnprefixedPopupHeights(popup('"md:h-[800px]"'))).toEqual([]);
  });

  test('reports the line of an unprefixed height', () => {
    expect(findUnprefixedPopupHeights(popup('"h-[800px]"'))).toEqual([3]);
  });

  test('reports an unprefixed height among other tokens', () => {
    expect(findUnprefixedPopupHeights(popup('"lg:max-w-[55%] h-[600px]"'))).toEqual([3]);
  });

  test('does not report max-h or min-h', () => {
    expect(findUnprefixedPopupHeights(popup('"max-h-[750px]"'))).toEqual([]);
    expect(findUnprefixedPopupHeights(popup('"min-h-[200px]"'))).toEqual([]);
  });

  test('ignores a className on JSX nested inside another prop', () => {
    const source =
      '  <Popup\n    header={\n      <div className="h-full" />\n    }\n    className="md:h-[80vh]"\n  >\n  </Popup>';

    expect(findUnprefixedPopupHeights(source)).toEqual([]);
  });

  test('reports an unprefixed height that follows a JSX-valued prop', () => {
    const source = '  <Popup\n    header={\n      <div />\n    }\n    className="h-[80vh]"\n  >\n  </Popup>';

    expect(findUnprefixedPopupHeights(source)).toEqual([5]);
  });

  test('does not match components that only start with Popup', () => {
    expect(findUnprefixedPopupHeights('<PopupHeader\n  className="h-full"\n/>')).toEqual([]);
  });
});

describe('Popup call sites', () => {
  test('pass no unprefixed h-* class (the ui-kit sets md:h-auto, which beats it at desktop widths)', () => {
    const offenders = collectSources(SRC_DIR).flatMap((file) =>
      findUnprefixedPopupHeights(fs.readFileSync(file, 'utf8')).map(
        (line) => `${path.relative(SRC_DIR, file).split(path.sep).join('/')}:${line}`,
      ),
    );

    expect(offenders).toEqual([]);
  });
});
