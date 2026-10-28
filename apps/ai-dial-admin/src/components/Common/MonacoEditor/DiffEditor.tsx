'use client';

import { FC } from 'react';

import { DiffEditor as MonacoReactDiffEditor, DiffEditorProps } from '@monaco-editor/react';

import EditorLoading from '@/src/components/Common/MonacoEditor/EditorLoading';
import { useBundledMonaco } from '@/src/components/Common/MonacoEditor/use-bundled-monaco';

/** `@monaco-editor/react`'s `DiffEditor`, mounted only once the bundled Monaco has loaded. */
const DiffEditor: FC<DiffEditorProps> = (props) => {
  const isMonacoReady = useBundledMonaco();

  if (!isMonacoReady) {
    return <EditorLoading className={props.className} width={props.width} height={props.height} />;
  }

  return <MonacoReactDiffEditor {...props} />;
};

export default DiffEditor;
