// `monaco-editor`'s own entry registers about 80 languages plus the TypeScript, CSS and HTML services. The
// console uses JSON and SQL, so it builds the instance from the editor core and those two only; plain text is
// part of the core, and `log` / `jsonata` are registered by their editors.
// `edcore.main.js` registers every editor feature (find, context menu, folding, diff…) and re-exports the same
// API as the typed `editor.api.js`, which supplies the namespace.
import 'monaco-editor/esm/vs/editor/edcore.main.js';
import * as editorApi from 'monaco-editor/esm/vs/editor/editor.api.js';
import * as jsonContribution from 'monaco-editor/esm/vs/language/json/monaco.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/sql/sql.contribution.js';

import type { BundledMonaco } from '@/src/components/Common/MonacoEditor/models';

// The contribution's own declaration file is empty; its runtime exports are the `json` namespace.
const json = jsonContribution as unknown as BundledMonaco['json'];

export const monaco: BundledMonaco = { ...editorApi, json };
