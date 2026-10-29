'use client';

import { FC } from 'react';

import { Editor as MonacoReactEditor, EditorProps } from '@monaco-editor/react';

import EditorLoading from '@/src/components/Common/MonacoEditor/EditorLoading';
import { useBundledMonaco } from '@/src/components/Common/MonacoEditor/use-bundled-monaco';

/** `@monaco-editor/react`'s `Editor`, mounted only once the bundled Monaco has loaded. */
const Editor: FC<EditorProps> = (props) => {
  const isMonacoReady = useBundledMonaco();

  if (!isMonacoReady) {
    return <EditorLoading className={props.className} width={props.width} height={props.height} />;
  }

  return <MonacoReactEditor {...props} />;
};

export default Editor;
