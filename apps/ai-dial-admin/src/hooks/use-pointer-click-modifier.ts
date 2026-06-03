'use client';

import { useEffect, useRef } from 'react';

import type { ClickModifier } from '@/src/components/EntityListView/utils/on-cell-clicked';

/** Captures modifier keys from pointerdown for callbacks that do not receive a MouseEvent (e.g. FileManager). */
export const usePointerClickModifier = () => {
  const modifierRef = useRef<ClickModifier | null>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      modifierRef.current = {
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        button: event.button,
      };
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, []);

  return modifierRef;
};
